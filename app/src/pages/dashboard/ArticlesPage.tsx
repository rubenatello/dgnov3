import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye, faSearch, faFilter, faBroom, faSort, faSortUp, faSortDown, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { cleanupOrphanedDrafts } from '../../services/cleanupService';
import type { Article, ArticleStatus } from '../../types/models';
import { collection, getDocs, deleteDoc, doc, query, where, orderBy, getDoc } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

type SortField = 'title' | 'status' | 'publishedAt' | 'lastUpdatedAt';
type SortDirection = 'asc' | 'desc';

export default function ArticlesPage() {
  const { userData, isWriter, isEditor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitedView, setLimitedView] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | ArticleStatus>('all');
  const [search, setSearch] = useState('');
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [cleaningUp, setCleaningUp] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('lastUpdatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  async function handleCleanupDrafts() {
    if (!userData?.id) return;
    
    if (!confirm('This will delete short drafts like "t", "te", etc. Continue?')) return;
    
    setCleaningUp(true);
    try {
      const deletedCount = await cleanupOrphanedDrafts(userData.id);
      if (deletedCount > 0) {
        alert(`Cleaned up ${deletedCount} orphaned drafts`);
        fetchArticles(); // Refresh the list
      } else {
        alert('No orphaned drafts found to clean up');
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Failed to clean up drafts');
    } finally {
      setCleaningUp(false);
    }
  }

  function formatMaybeTimestamp(value?: Timestamp | string | number | Date | unknown) {
    if (value == null) return '—';
    try {
      // Firestore Timestamp has toDate()
      if (typeof value === 'object' && value !== null && 'toDate' in (value as object) && typeof (value as { toDate?: unknown }).toDate === 'function') {
        return (value as Timestamp).toDate().toLocaleString();
      }
      const d = value instanceof Date ? value : new Date(String(value));
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString();
    } catch (err) {
      console.warn('formatMaybeTimestamp error', err);
      return '—';
    }
  }

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, userData]);

  async function fetchArticles() {
    setLoading(true);
    try {
      const articlesRef = collection(db, 'articles');
      let q;

      // Non-writer users should only fetch published articles (security rules
      // restrict reading drafts). Writers/editors/admins see broader results.
      if (!isWriter()) {
        // Always show published articles to non-writers regardless of the
        // selected filter (avoid permission denied errors).
        q = query(articlesRef, where('status', '==', 'published'), orderBy('lastUpdatedAt', 'desc'));
      } else {
        // Writers and above: allow filtering by status and (for writers-only)
        // restrict to their own articles when appropriate.
        q = query(articlesRef, orderBy('lastUpdatedAt', 'desc'));

        // Filter by status if not 'all'
        if (filterStatus !== 'all') {
          q = query(articlesRef, where('status', '==', filterStatus), orderBy('lastUpdatedAt', 'desc'));
        }

        // If user is writer (not editor/admin), only show their own articles
        if (isWriter() && !isEditor() && !isAdmin()) {
          q = query(articlesRef, where('authorId', '==', userData?.id), orderBy('lastUpdatedAt', 'desc'));
        }
      }

      const snapshot = await getDocs(q);
      const fetchedArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[];
      // gather unique lastUpdatedBy ids to resolve display names
      const uids = Array.from(new Set(fetchedArticles.map(a => a.lastUpdatedBy).filter(Boolean) as string[]));
      if (uids.length > 0) {
        const map: Record<string, string> = {};
        await Promise.all(uids.map(async uid => {
          try {
            const ud = await getDoc(doc(db, 'users', uid));
            if (ud.exists()) {
              const d = ud.data() as { displayName?: string; name?: string; email?: string };
              map[uid] = d.displayName || d.name || d.email || uid;
            } else {
              map[uid] = uid;
            }
          } catch (err) {
            console.warn('Failed to load user display for', uid, err);
            map[uid] = uid;
          }
        }));
        setUserMap(map);
      }
      setArticles(fetchedArticles);
    } catch (error) {
      // Firestore may require a composite index for some where+orderBy combos
      // or the security rules might block the privileged query. Provide a
      // graceful fallback: try published-only articles which are readable by
      // everyone and surface a limited-view message.
      const e = error as { code?: string; message?: string };
      if (e.code === 'failed-precondition' && e.message?.includes('index')) {
        console.error('Firestore index required for this query. Create it using the link in the error message:', e.message);
      } else if (e.message?.includes('Missing or insufficient permissions')) {
        console.warn('Privileged articles query failed due to permissions. Falling back to published-only query.');
        try {
          const fallbackQ = query(collection(db, 'articles'), where('status', '==', 'published'), orderBy('lastUpdatedAt', 'desc'));
          const snap = await getDocs(fallbackQ);
          setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Article[]);
          setLimitedView(true);
        } catch (fallbackErr) {
          console.error('Fallback fetch also failed:', fallbackErr);
        }
      } else {
        console.error('Error fetching articles:', error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(article: Article) {
    if (!article.id) return;
    if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    
    try {
      await deleteDoc(doc(db, 'articles', article.id));
      // Refresh list
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article. Check console for details.');
    }
  }

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.summary?.toLowerCase().includes(search.toLowerCase())
  );

  // Sorting logic
  const sortedArticles = useMemo(() => {
    const sorted = [...filteredArticles].sort((a, b) => {
      let aVal: string | number | Date = '';
      let bVal: string | number | Date = '';
      
      switch (sortField) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'publishedAt':
          aVal = a.publishedAt ? (typeof a.publishedAt === 'object' && 'toDate' in a.publishedAt ? (a.publishedAt as Timestamp).toDate().getTime() : new Date(String(a.publishedAt)).getTime()) : 0;
          bVal = b.publishedAt ? (typeof b.publishedAt === 'object' && 'toDate' in b.publishedAt ? (b.publishedAt as Timestamp).toDate().getTime() : new Date(String(b.publishedAt)).getTime()) : 0;
          break;
        case 'lastUpdatedAt':
          aVal = a.lastUpdatedAt ? (typeof a.lastUpdatedAt === 'object' && 'toDate' in a.lastUpdatedAt ? (a.lastUpdatedAt as Timestamp).toDate().getTime() : new Date(String(a.lastUpdatedAt)).getTime()) : 0;
          bVal = b.lastUpdatedAt ? (typeof b.lastUpdatedAt === 'object' && 'toDate' in b.lastUpdatedAt ? (b.lastUpdatedAt as Timestamp).toDate().getTime() : new Date(String(b.lastUpdatedAt)).getTime()) : 0;
          break;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredArticles, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedArticles.length / itemsPerPage);
  const paginatedArticles = sortedArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return faSort;
    return sortDirection === 'asc' ? faSortUp : faSortDown;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-ink">Manage Articles</h1>
            <p className="text-sm text-inkMuted mt-1">
              {sortedArticles.length} article{sortedArticles.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="bg-red-500/10 text-red-600 border border-red-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-500/20 transition-all text-sm font-medium"
              onClick={handleCleanupDrafts}
              disabled={cleaningUp}
            >
              <FontAwesomeIcon icon={faBroom} /> 
              {cleaningUp ? 'Cleaning...' : 'Clean Drafts'}
            </button>
            <button
              className="bg-accent text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-sm font-medium"
              onClick={() => navigate('/dashboard/articles/create')}
            >
              <FontAwesomeIcon icon={faPlus} /> Create Article
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl border border-stone p-4 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-inkMuted" />
              <span className="text-sm font-medium text-ink">Status:</span>
            </div>
            <div className="flex gap-2">
              {(['all', 'draft', 'review', 'scheduled', 'published'] as const).map((status) => (
                <button
                  key={status}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === status 
                      ? 'bg-accent text-white shadow-sm' 
                      : 'bg-stone/50 text-ink hover:bg-stone'
                  }`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all' ? 'All' : status === 'review' ? 'In Review' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-inkMuted">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-stone rounded-lg px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-accent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-4 py-2 pl-10 border border-stone rounded-lg focus:ring-2 focus:ring-accent focus:border-accent w-64 text-sm"
              />
              <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-2.5 text-inkMuted" />
            </div>
          </div>
        </div>

        {/* Limited View Warning */}
        {limitedView && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <span>Your view is limited to published articles. Drafts and private articles are visible only to writers and editors.</span>
          </div>
        )}

        {/* Articles Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-stone p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-accent border-r-transparent mb-4" />
            <p className="text-inkMuted">Loading articles...</p>
          </div>
        ) : paginatedArticles.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone p-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-inkMuted">
              {search ? 'No articles match your search.' : 'No articles found. Create your first article!'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-stone/30 to-stone/10 border-b border-stone">
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-ink uppercase tracking-wider cursor-pointer hover:bg-stone/20 transition-colors"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        Title
                        <FontAwesomeIcon icon={getSortIcon('title')} className="text-inkMuted" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink uppercase tracking-wider">
                      ID
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-ink uppercase tracking-wider cursor-pointer hover:bg-stone/20 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <FontAwesomeIcon icon={getSortIcon('status')} className="text-inkMuted" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-ink uppercase tracking-wider cursor-pointer hover:bg-stone/20 transition-colors"
                      onClick={() => handleSort('publishedAt')}
                    >
                      <div className="flex items-center gap-2">
                        Published
                        <FontAwesomeIcon icon={getSortIcon('publishedAt')} className="text-inkMuted" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-ink uppercase tracking-wider cursor-pointer hover:bg-stone/20 transition-colors"
                      onClick={() => handleSort('lastUpdatedAt')}
                    >
                      <div className="flex items-center gap-2">
                        Updated
                        <FontAwesomeIcon icon={getSortIcon('lastUpdatedAt')} className="text-inkMuted" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink uppercase tracking-wider">
                      Updated By
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-ink uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/50">
                  {paginatedArticles.map((article, idx) => (
                    <tr 
                      key={article.id} 
                      className={`hover:bg-accent/5 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-stone/5'}`}
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-ink hover:text-accent cursor-pointer" onClick={() => navigate(`/dashboard/articles/edit/${article.id}`)}>
                          {article.title}
                        </div>
                        <div className="text-xs text-inkMuted truncate max-w-md mt-0.5">{article.summary}</div>
                      </td>
                      <td className="px-4 py-4">
                        <code className="text-xs font-mono text-inkMuted bg-stone/30 px-2 py-1 rounded">
                          {article.id ? article.id.substring(0, 8) : 'N/A'}
                        </code>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`
                          inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                          ${article.status === 'published' ? 'bg-green-100 text-green-700' : ''}
                          ${article.status === 'draft' ? 'bg-gray-100 text-gray-700' : ''}
                          ${article.status === 'review' ? 'bg-blue-100 text-blue-700' : ''}
                          ${article.status === 'scheduled' ? 'bg-purple-100 text-purple-700' : ''}
                        `}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            article.status === 'published' ? 'bg-green-500' :
                            article.status === 'draft' ? 'bg-gray-500' :
                            article.status === 'review' ? 'bg-blue-500' :
                            'bg-purple-500'
                          }`} />
                          {article.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-inkMuted">
                        {formatMaybeTimestamp(article.publishedAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-inkMuted">
                        {formatMaybeTimestamp(article.lastUpdatedAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-inkMuted">
                        {article.lastUpdatedBy ? (userMap[article.lastUpdatedBy] || article.lastUpdatedBy.substring(0, 8)) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1 justify-end">
                          {article.status === 'published' && (
                            <button
                              onClick={() => navigate(`/article/${article.slug}`)}
                              className="p-2 hover:bg-stone rounded-lg transition-colors group"
                              title="View"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-inkMuted group-hover:text-accent" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/dashboard/articles/edit/${article.id}`)}
                            className="p-2 hover:bg-stone rounded-lg transition-colors group"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} className="text-inkMuted group-hover:text-accent" />
                          </button>
                          <button
                            onClick={() => handleDelete(article)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-inkMuted group-hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-stone bg-stone/10 flex items-center justify-between">
                <div className="text-sm text-inkMuted">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedArticles.length)} of {sortedArticles.length} articles
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-stone hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-inkMuted" />
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-accent text-white'
                              : 'hover:bg-white border border-stone text-inkMuted'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-stone hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="text-inkMuted" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
