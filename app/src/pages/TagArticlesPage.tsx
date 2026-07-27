import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ArticleCard from '../components/articles/ArticleCard';
import LoadingScreen from '../components/LoadingScreen';
import SEOHead from '../components/SEOHead';
import { getPublishedArticleSummaries } from '../services/publicArticleService';
import type { Article } from '../types/models';
import { slugifyTag, unslugifyTag } from '../utils/helpers';
import { SEO_CONFIG } from '../utils/seoConstants';

const TAG_PAGE_LOOKBACK_LIMIT = 100;

export default function TagArticlesPage() {
  const { tag = '' } = useParams<{ tag: string }>();
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tagName = unslugifyTag(tag);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getPublishedArticleSummaries(TAG_PAGE_LOOKBACK_LIMIT)
      .then((articles) => active && setRecentArticles(articles))
      .catch(() => active && setError('Tagged stories could not be loaded right now.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [tag]);

  const articles = useMemo(
    () => recentArticles.filter((article) => article.tags?.some((value) => slugifyTag(value) === tag)),
    [recentArticles, tag],
  );
  const canonicalUrl = `${SEO_CONFIG.siteUrl}/tag/${encodeURIComponent(tag)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[60vh]">
      <SEOHead
        title={`${tagName} news and analysis | DGNO`}
        description={`Recent DGNO reporting filed under ${tagName}.`}
        url={canonicalUrl}
        type="website"
        robots={!loading && !error && articles.length > 0 ? 'index, follow' : 'noindex, follow'}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-inkMuted mb-5">
        <Link to="/" className="hover:text-accent">Home</Link> <span aria-hidden="true">/</span> Tags <span aria-hidden="true">/</span> {tagName}
      </nav>
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink">Recent stories tagged “{tagName}”</h1>
      <p className="mt-3 text-inkMuted max-w-2xl">
        This page covers the most recent {TAG_PAGE_LOOKBACK_LIMIT} published stories. Tags describe newsroom filing, not a claim that every story reaches the same conclusion.
      </p>
      {loading ? (
        <LoadingScreen message="Loading tagged stories…" />
      ) : error ? (
        <p role="alert" className="mt-8 p-4 bg-red-50 border-l-4 border-red-600 text-red-900">{error}</p>
      ) : articles.length ? (
        <div className="mt-8 divide-y divide-stone/40">
          {articles.map((article) => <ArticleCard key={article.id} article={article} variant="list" />)}
        </div>
      ) : (
        <p className="mt-8 text-inkMuted">No recent published stories use this tag.</p>
      )}
    </div>
  );
}
