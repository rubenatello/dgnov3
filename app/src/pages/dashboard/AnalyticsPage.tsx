

import { useEffect, useState, useMemo } from 'react';
import { db } from '../../config/firebase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Area, AreaChart 
} from 'recharts';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { fetchAuthors, fetchArticlesAnalytics, type ArticleAnalytics } from '../../utils/articleAnalytics';
import { format, subDays, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown, faDownload, faFilter, faChartLine, faChartBar, faEye, faHeart, faNewspaper, faTrophy, faUsers } from '@fortawesome/free-solid-svg-icons';

type ArticleSortField = 'title' | 'viewCount' | 'likeCount' | 'authorName';
type AuthorSortField = 'name' | 'articles' | 'totalViews' | 'avgViews' | 'avgLikes';
type SortDirection = 'asc' | 'desc';

interface AuthorStats {
  name: string;
  articles: number;
  totalViews: number;
  totalLikes: number;
  avgViews: number;
  avgLikes: number;
}

interface DailyStats {
  date: string;
  views: number;
  likes: number;
  articles: number;
}

interface KPIData {
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
  avgViewsPerArticle: number;
  avgLikesPerArticle: number;
  engagementRate: number; // likes/views ratio
}

export default function AnalyticsPage() {
  const [articles, setArticles] = useState<ArticleAnalytics[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [sortBy, setSortBy] = useState<'viewCount' | 'likeCount'>('viewCount');
  const [loading, setLoading] = useState(false);

  // Sorting state for tables
  const [articleSortField, setArticleSortField] = useState<ArticleSortField>('viewCount');
  const [articleSortDir, setArticleSortDir] = useState<SortDirection>('desc');
  const [authorSortField, setAuthorSortField] = useState<AuthorSortField>('totalViews');
  const [authorSortDir, setAuthorSortDir] = useState<SortDirection>('desc');

  // Computed analytics data
  const [authorStats, setAuthorStats] = useState<AuthorStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalArticles: 0,
    totalViews: 0,
    totalLikes: 0,
    avgViewsPerArticle: 0,
    avgLikesPerArticle: 0,
    engagementRate: 0
  });

  // Fetch authors for dropdown
  useEffect(() => {
    fetchAuthors(db).then(setAuthors);
  }, []);

  // Handle preset date ranges
  useEffect(() => {
    if (datePreset !== 'custom') {
      const today = new Date();
      let fromDate = '';
      if (datePreset === '7d') fromDate = format(subDays(today, 7), 'yyyy-MM-dd');
      if (datePreset === '30d') fromDate = format(subDays(today, 30), 'yyyy-MM-dd');
      if (datePreset === '90d') fromDate = format(subDays(today, 90), 'yyyy-MM-dd');
      setDateFrom(fromDate);
      setDateTo(format(today, 'yyyy-MM-dd'));
    }
  }, [datePreset]);

  // Fetch articles with filters and compute analytics
  useEffect(() => {
    setLoading(true);
    fetchArticlesAnalytics(db, {
      author: selectedAuthor,
      dateFrom,
      dateTo,
      sortBy,
      max: 100, // Get more data for better analytics
    }).then(data => {
      setArticles(data.slice(0, 20)); // Top 20 for display
      computeAnalytics(data);
      setLoading(false);
    });
  }, [selectedAuthor, dateFrom, dateTo, sortBy]);

  const computeAnalytics = (data: ArticleAnalytics[]) => {
    // KPI calculations
    const totalArticles = data.length;
    const totalViews = data.reduce((sum, article) => sum + article.viewCount, 0);
    const totalLikes = data.reduce((sum, article) => sum + article.likeCount, 0);
    const avgViewsPerArticle = totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0;
    const avgLikesPerArticle = totalArticles > 0 ? Math.round(totalLikes / totalArticles) : 0;
    const engagementRate = totalViews > 0 ? Math.round((totalLikes / totalViews) * 100 * 100) / 100 : 0;

    setKpiData({
      totalArticles,
      totalViews,
      totalLikes,
      avgViewsPerArticle,
      avgLikesPerArticle,
      engagementRate
    });

    // Author statistics
    const authorMap = new Map<string, { articles: number; views: number; likes: number }>();
    data.forEach(article => {
      const author = article.authorName || 'Unknown';
      const existing = authorMap.get(author) || { articles: 0, views: 0, likes: 0 };
      authorMap.set(author, {
        articles: existing.articles + 1,
        views: existing.views + article.viewCount,
        likes: existing.likes + article.likeCount
      });
    });

    const authorStatsData: AuthorStats[] = Array.from(authorMap.entries())
      .map(([name, stats]) => ({
        name,
        articles: stats.articles,
        totalViews: stats.views,
        totalLikes: stats.likes,
        avgViews: Math.round(stats.views / stats.articles),
        avgLikes: Math.round(stats.likes / stats.articles)
      }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 10);

    setAuthorStats(authorStatsData);

    // Daily statistics (if we have publishedAt dates)
    const dailyMap = new Map<string, { views: number; likes: number; articles: number }>();
    data.forEach(article => {
      if (article.publishedAt) {
        const dateKey = format(article.publishedAt, 'yyyy-MM-dd');
        const existing = dailyMap.get(dateKey) || { views: 0, likes: 0, articles: 0 };
        dailyMap.set(dateKey, {
          views: existing.views + article.viewCount,
          likes: existing.likes + article.likeCount,
          articles: existing.articles + 1
        });
      }
    });

    const dailyStatsData: DailyStats[] = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setDailyStats(dailyStatsData);
  };

  // Sorted articles for table
  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      
      switch (articleSortField) {
        case 'title': aVal = a.title.toLowerCase(); bVal = b.title.toLowerCase(); break;
        case 'viewCount': aVal = a.viewCount; bVal = b.viewCount; break;
        case 'likeCount': aVal = a.likeCount; bVal = b.likeCount; break;
        case 'authorName': aVal = (a.authorName || '').toLowerCase(); bVal = (b.authorName || '').toLowerCase(); break;
      }
      
      if (aVal < bVal) return articleSortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return articleSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [articles, articleSortField, articleSortDir]);

  // Sorted author stats for table
  const sortedAuthorStats = useMemo(() => {
    return [...authorStats].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      
      switch (authorSortField) {
        case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case 'articles': aVal = a.articles; bVal = b.articles; break;
        case 'totalViews': aVal = a.totalViews; bVal = b.totalViews; break;
        case 'avgViews': aVal = a.avgViews; bVal = b.avgViews; break;
        case 'avgLikes': aVal = a.avgLikes; bVal = b.avgLikes; break;
      }
      
      if (aVal < bVal) return authorSortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return authorSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [authorStats, authorSortField, authorSortDir]);

  const handleArticleSort = (field: ArticleSortField) => {
    if (articleSortField === field) {
      setArticleSortDir(articleSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setArticleSortField(field);
      setArticleSortDir('desc');
    }
  };

  const handleAuthorSort = (field: AuthorSortField) => {
    if (authorSortField === field) {
      setAuthorSortDir(authorSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setAuthorSortField(field);
      setAuthorSortDir('desc');
    }
  };

  const getArticleSortIcon = (field: ArticleSortField) => {
    if (articleSortField !== field) return faSort;
    return articleSortDir === 'asc' ? faSortUp : faSortDown;
  };

  const getAuthorSortIcon = (field: AuthorSortField) => {
    if (authorSortField !== field) return faSort;
    return authorSortDir === 'asc' ? faSortUp : faSortDown;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const exportAnalyticsData = () => {
    // Prepare data for export
    const csvData = [
      // Header row
      ['Title', 'Slug', 'Author', 'Views', 'Likes', 'Engagement Rate (%)', 'Published Date', 'Section'].join(','),
      // Data rows
      ...articles.map(article => [
        `"${article.title.replace(/"/g, '""')}"`,
        article.slug,
        `"${(article.authorName || 'Unknown').replace(/"/g, '""')}"`,
        article.viewCount,
        article.likeCount,
        article.viewCount > 0 ? ((article.likeCount / article.viewCount) * 100).toFixed(2) : '0',
        article.publishedAt ? format(article.publishedAt, 'yyyy-MM-dd') : '',
        `"${(article.section || '').replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="bg-white rounded-xl border border-stone p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faChartLine} className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Analytics Dashboard</h1>
                <p className="text-sm text-inkMuted">Track your content performance</p>
              </div>
            </div>
            
            <button
              onClick={exportAnalyticsData}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
              <FontAwesomeIcon icon={faDownload} />
              Export CSV
            </button>
          </div>

          {/* Filters Row */}
          <div className="mt-6 pt-6 border-t border-stone flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-sm text-inkMuted">
              <FontAwesomeIcon icon={faFilter} />
              Filters:
            </div>
            
            <select
              value={selectedAuthor}
              onChange={e => setSelectedAuthor(e.target.value)}
              className="border border-stone rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Authors</option>
              {authors.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <select
              value={datePreset}
              onChange={e => setDatePreset(e.target.value as '7d' | '30d' | '90d' | 'custom')}
              className="border border-stone rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-accent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom Range</option>
            </select>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="border border-stone rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent"
                />
                <span className="text-inkMuted">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="border border-stone rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent"
                />
              </div>
            )}

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'viewCount' | 'likeCount')}
              className="border border-stone rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-accent"
            >
              <option value="viewCount">Sort by Views</option>
              <option value="likeCount">Sort by Likes</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-stone p-4 hover:shadow-lg hover:border-blue-300 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <FontAwesomeIcon icon={faNewspaper} className="text-blue-600 group-hover:text-white text-sm" />
              </div>
              <span className="text-xs font-medium text-inkMuted uppercase tracking-wide">Articles</span>
            </div>
            <p className="text-2xl font-bold text-ink">{formatNumber(kpiData.totalArticles)}</p>
          </div>

          <div className="bg-white rounded-xl border border-stone p-4 hover:shadow-lg hover:border-green-300 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                <FontAwesomeIcon icon={faEye} className="text-green-600 group-hover:text-white text-sm" />
              </div>
              <span className="text-xs font-medium text-inkMuted uppercase tracking-wide">Views</span>
            </div>
            <p className="text-2xl font-bold text-ink">{formatNumber(kpiData.totalViews)}</p>
          </div>

          <div className="bg-white rounded-xl border border-stone p-4 hover:shadow-lg hover:border-pink-300 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                <FontAwesomeIcon icon={faHeart} className="text-pink-600 group-hover:text-white text-sm" />
              </div>
              <span className="text-xs font-medium text-inkMuted uppercase tracking-wide">Likes</span>
            </div>
            <p className="text-2xl font-bold text-ink">{formatNumber(kpiData.totalLikes)}</p>
          </div>

          <div className="bg-white rounded-xl border border-stone p-4 hover:shadow-lg hover:border-orange-300 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <FontAwesomeIcon icon={faEye} className="text-orange-600 group-hover:text-white text-sm" />
              </div>
              <span className="text-xs font-medium text-inkMuted uppercase tracking-wide">Avg Views</span>
            </div>
            <p className="text-2xl font-bold text-ink">{formatNumber(kpiData.avgViewsPerArticle)}</p>
          </div>

          <div className="bg-white rounded-xl border border-stone p-4 hover:shadow-lg hover:border-purple-300 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <FontAwesomeIcon icon={faHeart} className="text-purple-600 group-hover:text-white text-sm" />
              </div>
              <span className="text-xs font-medium text-inkMuted uppercase tracking-wide">Avg Likes</span>
            </div>
            <p className="text-2xl font-bold text-ink">{formatNumber(kpiData.avgLikesPerArticle)}</p>
          </div>

          <div className="bg-white rounded-xl border border-stone p-4 hover:shadow-lg hover:border-indigo-300 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                <FontAwesomeIcon icon={faTrophy} className="text-indigo-600 group-hover:text-white text-sm" />
              </div>
              <span className="text-xs font-medium text-inkMuted uppercase tracking-wide">Engagement</span>
            </div>
            <p className="text-2xl font-bold text-ink">{kpiData.engagementRate}%</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Top Articles Chart */}
          <div className="bg-white rounded-xl border border-stone p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FontAwesomeIcon icon={faChartBar} className="text-blue-600 text-sm" />
              </div>
              <h2 className="text-lg font-semibold text-ink">Top Performing Articles</h2>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={articles}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="title" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [formatNumber(Number(value)), name]}
                  labelFormatter={(label) => `Article: ${label}`}
                />
                <Bar dataKey="viewCount" fill="#3B82F6" name="Views" />
                <Bar dataKey="likeCount" fill="#10B981" name="Likes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Author Performance Chart */}
          <div className="bg-white rounded-xl border border-stone p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <FontAwesomeIcon icon={faUsers} className="text-purple-600 text-sm" />
              </div>
              <h2 className="text-lg font-semibold text-ink">Author Performance</h2>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={authorStats} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 11 }}
                  width={100}
                />
                <Tooltip 
                  formatter={(value, name) => [formatNumber(Number(value)), name]}
                />
                <Bar dataKey="totalViews" fill="#8B5CF6" name="Total Views" />
                <Bar dataKey="articles" fill="#F59E0B" name="Articles" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Trend Chart */}
          {dailyStats.length > 0 && (
            <div className="bg-white rounded-xl border border-stone p-6 shadow-sm hover:shadow-md transition-shadow xl:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faChartLine} className="text-green-600 text-sm" />
                </div>
                <h2 className="text-lg font-semibold text-ink">Daily Performance Trends</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [formatNumber(Number(value)), name]}
                    labelFormatter={(date) => format(parseISO(date), 'MMM dd, yyyy')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stackId="1" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                    name="Views"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="likes" 
                    stackId="1" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                    name="Likes"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-xl border border-stone p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faTrophy} className="text-amber-600 text-sm" />
            </div>
            <h2 className="text-lg font-semibold text-ink">Performance Insights</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Top Article Views</div>
              <div className="text-2xl font-bold text-blue-700">
                {articles.length > 0 ? formatNumber(articles[0].viewCount) : '0'}
              </div>
              <div className="text-xs text-blue-500 truncate mt-1">
                {articles.length > 0 ? articles[0].title.slice(0, 25) + '...' : 'No data'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
              <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Most Liked Article</div>
              <div className="text-2xl font-bold text-green-700">
                {articles.length > 0 ? formatNumber(Math.max(...articles.map(a => a.likeCount))) : '0'}
              </div>
              <div className="text-xs text-green-500 truncate mt-1">
                {articles.length > 0 ? 
                  articles.find(a => a.likeCount === Math.max(...articles.map(a => a.likeCount)))?.title.slice(0, 25) + '...' 
                  : 'No data'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
              <div className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Top Author</div>
              <div className="text-2xl font-bold text-purple-700">
                {authorStats.length > 0 ? formatNumber(authorStats[0].totalViews) : '0'}
              </div>
              <div className="text-xs text-purple-500 truncate mt-1">
                {authorStats.length > 0 ? authorStats[0].name : 'No data'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
              <div className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-1">Best Engagement</div>
              <div className="text-2xl font-bold text-orange-700">
                {articles.length > 0 ? 
                  Math.max(...articles.map(a => a.viewCount > 0 ? (a.likeCount / a.viewCount) * 100 : 0)).toFixed(1) + '%'
                  : '0%'}
              </div>
              <div className="text-xs text-orange-500 mt-1">
                Highest like-to-view ratio
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Top Articles Table */}
          <div className="bg-white rounded-xl border border-stone p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FontAwesomeIcon icon={faNewspaper} className="text-blue-600 text-sm" />
              </div>
              <h2 className="text-lg font-semibold text-ink">Article Performance Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone">
                <thead>
                  <tr className="bg-stone/30">
                    <th 
                      className="px-3 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/50 transition-colors"
                      onClick={() => handleArticleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        Title
                        <FontAwesomeIcon icon={getArticleSortIcon('title')} className="text-inkMuted" />
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/50 transition-colors"
                      onClick={() => handleArticleSort('viewCount')}
                    >
                      <div className="flex items-center gap-2">
                        Views
                        <FontAwesomeIcon icon={getArticleSortIcon('viewCount')} className="text-inkMuted" />
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/50 transition-colors"
                      onClick={() => handleArticleSort('likeCount')}
                    >
                      <div className="flex items-center gap-2">
                        Likes
                        <FontAwesomeIcon icon={getArticleSortIcon('likeCount')} className="text-inkMuted" />
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/50 transition-colors"
                      onClick={() => handleArticleSort('authorName')}
                    >
                      <div className="flex items-center gap-2">
                        Author
                        <FontAwesomeIcon icon={getArticleSortIcon('authorName')} className="text-inkMuted" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone">
                  {sortedArticles.slice(0, 10).map((article, index) => (
                    <tr key={index} className="hover:bg-stone/20 transition-colors">
                      <td className="px-3 py-3 text-sm text-ink max-w-xs">
                        <Link 
                          to={`/article/${article.slug}`} 
                          className="text-accent hover:text-accent/80 hover:underline truncate block font-medium"
                          title={article.title}
                        >
                          {article.title}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-sm text-inkMuted font-medium">
                        {formatNumber(article.viewCount)}
                      </td>
                      <td className="px-3 py-3 text-sm text-inkMuted font-medium">
                        {formatNumber(article.likeCount)}
                      </td>
                      <td className="px-3 py-3 text-sm text-inkMuted">
                        {article.authorName || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Author Stats Table */}
          <div className="bg-white rounded-xl border border-stone p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <FontAwesomeIcon icon={faUsers} className="text-purple-600 text-sm" />
              </div>
              <h2 className="text-lg font-semibold text-ink">Author Statistics</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone">
                <thead>
                  <tr className="bg-stone/30">
                    <th 
                      className="px-3 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/50 transition-colors"
                      onClick={() => handleAuthorSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Author
                        <FontAwesomeIcon icon={getAuthorSortIcon('name')} className="text-inkMuted" />
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/50 transition-colors"
                      onClick={() => handleAuthorSort('articles')}
                    >
                      <div className="flex items-center gap-2">
                        Articles
                        <FontAwesomeIcon icon={getAuthorSortIcon('articles')} className="text-inkMuted" />
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/50 transition-colors"
                      onClick={() => handleAuthorSort('totalViews')}
                    >
                      <div className="flex items-center gap-2">
                        Total Views
                        <FontAwesomeIcon icon={getAuthorSortIcon('totalViews')} className="text-inkMuted" />
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/50 transition-colors"
                      onClick={() => handleAuthorSort('avgViews')}
                    >
                      <div className="flex items-center gap-2">
                        Avg Views
                        <FontAwesomeIcon icon={getAuthorSortIcon('avgViews')} className="text-inkMuted" />
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/50 transition-colors"
                      onClick={() => handleAuthorSort('avgLikes')}
                    >
                      <div className="flex items-center gap-2">
                        Avg Likes
                        <FontAwesomeIcon icon={getAuthorSortIcon('avgLikes')} className="text-inkMuted" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone">
                  {sortedAuthorStats.map((author, index) => (
                    <tr key={index} className="hover:bg-stone/20 transition-colors">
                      <td className="px-3 py-3 text-sm font-medium text-ink">
                        {author.name}
                      </td>
                      <td className="px-3 py-3 text-sm text-inkMuted font-medium">
                        {author.articles}
                      </td>
                      <td className="px-3 py-3 text-sm text-inkMuted font-medium">
                        {formatNumber(author.totalViews)}
                      </td>
                      <td className="px-3 py-3 text-sm text-inkMuted">
                        {formatNumber(author.avgViews)}
                      </td>
                      <td className="px-3 py-3 text-sm text-inkMuted">
                        {formatNumber(author.avgLikes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}