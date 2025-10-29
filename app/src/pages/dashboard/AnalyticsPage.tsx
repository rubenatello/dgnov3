

import { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

import { fetchAuthors, fetchArticlesAnalytics, type ArticleAnalytics } from '../../utils/articleAnalytics';
import { format, subDays } from 'date-fns';


export default function AnalyticsPage() {


  const [articles, setArticles] = useState<ArticleAnalytics[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'7d' | '30d' | '90d' | 'custom'>('7d');
  const [sortBy, setSortBy] = useState<'viewCount' | 'likeCount'>('viewCount');

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

  // Fetch articles with filters
  useEffect(() => {
    fetchArticlesAnalytics(db, {
      author: selectedAuthor,
      dateFrom,
      dateTo,
      sortBy,
      max: 20,
    }).then(setArticles);
  }, [selectedAuthor, dateFrom, dateTo, sortBy]);

  return (
    <DashboardLayout>
      <div className="p-6 bg-white rounded shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <h1 className="text-2xl font-bold">Top Performing Articles</h1>
          <div className="flex flex-row gap-2 items-center">
            <label className="text-sm font-medium">Author:</label>
            <select
              value={selectedAuthor}
              onChange={e => setSelectedAuthor(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              {authors.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <label className="text-sm font-medium ml-4">Date Range:</label>
            <select
              value={datePreset}
              onChange={e => setDatePreset(e.target.value as '7d' | '30d' | '90d' | 'custom')}
              className="border rounded px-2 py-1 text-sm bg-accent text-white shadow"
              style={{ background: 'var(--accent-color, #3b82f6)', color: 'white' }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom</option>
            </select>
            {datePreset === 'custom' && (
              <>
                <label className="text-sm font-medium ml-2">From:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
                <label className="text-sm font-medium ml-2">To:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
              </>
            )}
            <label className="text-sm font-medium ml-4">Sort By:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'viewCount' | 'likeCount')}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="viewCount">Views</option>
              <option value="likeCount">Likes</option>
            </select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={articles}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="viewCount" fill="#8884d8" name="Views" />
            <Bar dataKey="likeCount" fill="#82ca9d" name="Likes" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardLayout>
  );
}