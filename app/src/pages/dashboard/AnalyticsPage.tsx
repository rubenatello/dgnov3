

import { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Area, AreaChart 
} from 'recharts';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { fetchAuthors, fetchArticlesAnalytics, type ArticleAnalytics } from '../../utils/articleAnalytics';
import { format, subDays, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

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
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <button
                onClick={exportAnalyticsData}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Export CSV
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Author:</label>
                <select
                  value={selectedAuthor}
                  onChange={e => setSelectedAuthor(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Authors</option>
                  {authors.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Period:</label>
                <select
                  value={datePreset}
                  onChange={e => setDatePreset(e.target.value as '7d' | '30d' | '90d' | 'custom')}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {datePreset === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'viewCount' | 'likeCount')}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="viewCount">Views</option>
                  <option value="likeCount">Likes</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Articles</h3>
            <p className="text-2xl font-bold text-blue-600">{formatNumber(kpiData.totalArticles)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Views</h3>
            <p className="text-2xl font-bold text-green-600">{formatNumber(kpiData.totalViews)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Likes</h3>
            <p className="text-2xl font-bold text-purple-600">{formatNumber(kpiData.totalLikes)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Views/Article</h3>
            <p className="text-2xl font-bold text-orange-600">{formatNumber(kpiData.avgViewsPerArticle)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Likes/Article</h3>
            <p className="text-2xl font-bold text-pink-600">{formatNumber(kpiData.avgLikesPerArticle)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Engagement Rate</h3>
            <p className="text-2xl font-bold text-indigo-600">{kpiData.engagementRate}%</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Top Articles Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Top Performing Articles</h2>
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
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Author Performance</h2>
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
            <div className="bg-white p-6 rounded-lg shadow xl:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Daily Performance Trends</h2>
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
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Performance Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Top Article Views</div>
              <div className="text-2xl font-bold text-blue-600">
                {articles.length > 0 ? formatNumber(articles[0].viewCount) : '0'}
              </div>
              <div className="text-xs text-gray-500">
                {articles.length > 0 ? articles[0].title.slice(0, 30) + '...' : 'No data'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Most Liked Article</div>
              <div className="text-2xl font-bold text-green-600">
                {articles.length > 0 ? formatNumber(Math.max(...articles.map(a => a.likeCount))) : '0'}
              </div>
              <div className="text-xs text-gray-500">
                {articles.length > 0 ? 
                  articles.find(a => a.likeCount === Math.max(...articles.map(a => a.likeCount)))?.title.slice(0, 30) + '...' 
                  : 'No data'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Top Author</div>
              <div className="text-2xl font-bold text-purple-600">
                {authorStats.length > 0 ? formatNumber(authorStats[0].totalViews) : '0'}
              </div>
              <div className="text-xs text-gray-500">
                {authorStats.length > 0 ? authorStats[0].name : 'No data'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Best Engagement</div>
              <div className="text-2xl font-bold text-orange-600">
                {articles.length > 0 ? 
                  Math.max(...articles.map(a => a.viewCount > 0 ? (a.likeCount / a.viewCount) * 100 : 0)).toFixed(1) + '%'
                  : '0%'}
              </div>
              <div className="text-xs text-gray-500">
                Highest like-to-view ratio
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Top Articles Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Article Performance Details</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Likes
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {articles.slice(0, 10).map((article, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm text-gray-900 max-w-xs">
                        <Link 
                          to={`/articles/${article.slug}`} 
                          className="text-blue-600 hover:text-blue-800 hover:underline truncate block"
                          title={article.title}
                        >
                          {article.title}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {formatNumber(article.viewCount)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {formatNumber(article.likeCount)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {article.authorName || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Author Stats Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Author Statistics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Articles
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Views
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Views
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Likes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {authorStats.map((author, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">
                        {author.name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {author.articles}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {formatNumber(author.totalViews)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {formatNumber(author.avgViews)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
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