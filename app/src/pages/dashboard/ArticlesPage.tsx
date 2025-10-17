import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import type { Article, ArticleStatus } from '../../types/models';
import { collection, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function ArticlesPage() {
  const { userData, isWriter, isEditor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitedView, setLimitedView] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | ArticleStatus>('all');
  const [search, setSearch] = useState('');

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

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-ink">Manage Articles</h1>
          <button
            className="bg-accent text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90 transition-all"
            onClick={() => navigate('/dashboard/articles/create')}
          >
            <FontAwesomeIcon icon={faPlus} /> Create Article
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 items-center">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} className="text-inkMuted" />
            <span className="text-sm font-medium text-ink">Status:</span>
          </div>
          <button
            className={`px-3 py-1.5 rounded text-sm ${filterStatus === 'all' ? 'bg-accent text-white' : 'bg-stone text-ink hover:bg-opacity-80'}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm ${filterStatus === 'draft' ? 'bg-accent text-white' : 'bg-stone text-ink hover:bg-opacity-80'}`}
            onClick={() => setFilterStatus('draft')}
          >
            Draft
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm ${filterStatus === 'review' ? 'bg-accent text-white' : 'bg-stone text-ink hover:bg-opacity-80'}`}
            onClick={() => setFilterStatus('review')}
          >
            In Review
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm ${filterStatus === 'scheduled' ? 'bg-accent text-white' : 'bg-stone text-ink hover:bg-opacity-80'}`}
            onClick={() => setFilterStatus('scheduled')}
          >
            Scheduled
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm ${filterStatus === 'published' ? 'bg-accent text-white' : 'bg-stone text-ink hover:bg-opacity-80'}`}
            onClick={() => setFilterStatus('published')}
          >
            Published
          </button>

          <div className="flex-1"></div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-1.5 pl-9 border border-stone rounded-lg focus:ring-2 focus:ring-accent w-64"
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-2.5 text-inkMuted" />
          </div>
        </div>

        {/* Articles Table */}
        {limitedView && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
            Your view is limited to published articles. Drafts and private articles are visible only to writers and editors.
          </div>
        )}
        {loading ? (
          <div className="text-center text-inkMuted py-12">Loading articles...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center text-inkMuted py-12">
            {search ? 'No articles match your search.' : 'No articles found. Create your first article!'}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-stone overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone bg-opacity-30">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ink">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ink">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-ink">Last Updated</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-ink">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map(article => (
                  <tr key={article.id} className="border-t border-stone hover:bg-stone hover:bg-opacity-10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{article.title}</div>
                      <div className="text-xs text-inkMuted truncate max-w-md">{article.summary}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`
                        inline-block px-2 py-1 rounded text-xs font-medium
                        ${article.status === 'published' ? 'bg-green-100 text-green-800' : ''}
                        ${article.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                        ${article.status === 'review' ? 'bg-blue-100 text-blue-800' : ''}
                        ${article.status === 'scheduled' ? 'bg-purple-100 text-purple-800' : ''}
                      `}>
                        {article.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-inkMuted">
                      {article.lastUpdatedAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        {article.status === 'published' && (
                          <button
                            onClick={() => navigate(`/article/${article.slug}`)}
                            className="p-2 hover:bg-stone rounded transition-colors"
                            title="View"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-inkMuted hover:text-ink" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/dashboard/articles/edit/${article.id}`)}
                          className="p-2 hover:bg-stone rounded transition-colors"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-inkMuted hover:text-accent" />
                        </button>
                        <button
                          onClick={() => handleDelete(article)}
                          className="p-2 hover:bg-stone rounded transition-colors"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-inkMuted hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
