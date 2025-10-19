import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedArticles } from '../services/articleService';
import type { Article } from '../types/models';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

function ArticleCard({ article }: { article: Article }) {
  const _p: unknown = article.publishedAt;
  const publishedAt = _p
    ? (_p instanceof Timestamp ? _p.toDate() : (_p instanceof Date ? _p : new Date(String(_p))))
    : null;
  return (
    <Link to={`/article/${article.slug}`} className="block group">
      <div className="flex gap-4 items-start">
        {article.featuredImageUrl ? (
          <img src={article.featuredImageUrl} alt={article.title} className="w-36 h-24 object-cover rounded-md" />
        ) : (
          <div className="w-36 h-24 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">Image</div>
        )}
        <div>
          <h3 className="text-lg font-medium text-ink group-hover:text-accent">{article.title}</h3>
          {article.summary && <p className="text-sm text-inkMuted line-clamp-2">{article.summary}</p>}
          <div className="text-xs text-gray-500 mt-1">
            {article.authorName && <span className="mr-2">By {article.authorName}</span>}
            {publishedAt && <span>{format(publishedAt, 'MMM d, yyyy')}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getPublishedArticles()
      .then(setArticles)
      .catch((err) => {
        console.error('Failed to load articles', err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  // Most recent
  const mostRecent = articles.slice(0, 6);

  // Trending (by viewCount fallback to publishedAt)
  const trending = [...articles]
    .sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>).viewCount as number | undefined;
      const vb = (b as unknown as Record<string, unknown>).viewCount as number | undefined;
      return (vb || 0) - (va || 0);
    })
    .slice(0, 6);

  // Recommended: pick tags from latest article and find others with overlap
  let recommended: Article[] = [];
  if (articles.length > 0) {
    const seed = articles[0];
    const seedTags = seed.tags || [];
    if (seedTags.length > 0) {
      const scored = articles
        .filter(a => a.id !== seed.id)
        .map(a => ({
          a,
          score: (a.tags || []).reduce((s, t) => s + (seedTags.includes(t) ? 1 : 0), 0)
        }))
        .filter(x => x.score > 0)
        .sort((x, y) => {
          if (y.score !== x.score) return y.score - x.score;
          const ya = (y.a.publishedAt as unknown) as unknown;
          const xa = (x.a.publishedAt as unknown) as unknown;
          const dy = ya instanceof Timestamp ? ya.toDate().getTime() : (ya instanceof Date ? ya.getTime() : +new Date(String(ya)));
          const dx = xa instanceof Timestamp ? xa.toDate().getTime() : (xa instanceof Date ? xa.getTime() : +new Date(String(xa)));
          return dy - dx;
        })
        .map(x => x.a);
      recommended = scored.slice(0, 6);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-heading font-bold">Latest</h1>
        <p className="text-gray-600">Fresh reporting and analysis — updated as published</p>
      </header>

      {loading && <div>Loading articles…</div>}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          <strong>Error loading articles:</strong>
          <div className="text-sm mt-1">{error}</div>
          <div className="mt-2 text-xs text-gray-600">If this mentions a missing index, open the Firebase Console → Firestore → Indexes and create the suggested composite index (status + publishedAt).</div>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-12">
          {articles.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">
              No published articles were found. Verify in the Firestore console that the article document has <code>status: "published"</code> and a valid <code>publishedAt</code> timestamp. If you've just published an article, wait a few seconds for server timestamps to propagate.
            </div>
          )}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Most recent</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mostRecent.map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Trending</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trending.map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>

          {recommended.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Recommended</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommended.map(a => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
