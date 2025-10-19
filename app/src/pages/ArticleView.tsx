import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticleBySlug } from '../services/articleService';
import type { Article } from '../types/models';
import { formatDistanceToNow, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export default function ArticleView() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getArticleBySlug(slug)
      .then(a => {
        if (!a) {
          setError('Article not found');
        } else {
          setArticle(a);
        }
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-8">Loading article…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!article) return <div className="p-8">No article</div>;

  // helper: format publish date and relative updated
  const _pubVal: unknown = article.publishedAt;
  const publishedAt = _pubVal
    ? (_pubVal instanceof Timestamp
        ? _pubVal.toDate()
        : (_pubVal as unknown) instanceof Date
          ? (_pubVal as Date)
          : new Date(String(_pubVal)))
    : null;

  const _lastVal: unknown = article.lastUpdatedAt;
  const lastUpdatedAt = _lastVal
    ? (_lastVal instanceof Timestamp
        ? _lastVal.toDate()
        : (_lastVal as unknown) instanceof Date
          ? (_lastVal as Date)
          : new Date(String(_lastVal)))
    : null;

  return (
    <article className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{article.title}</h1>

      {article.subtitle && (
        <h2 className="text-xl text-gray-700 mb-4">{article.subtitle}</h2>
      )}

      {/** Featured image block — prefer featuredImageUrl, fallback to featuredImageId placeholder */}
      {(article.featuredImageUrl || article.featuredImageId) && (
        <div className="mb-6 text-center">
          <img
            src={article.featuredImageUrl ? article.featuredImageUrl : `/media/${article.featuredImageId}`}
            alt={article.title}
            className="mx-auto rounded max-w-full h-auto"
          />
        </div>
      )}

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
        <div className="mb-2 sm:mb-0">
          {article.authorName && <span className="mr-2">By {article.authorName}</span>}
        </div>
        <div className="text-right text-sm text-gray-600">
          {publishedAt && (
            <div className="">{format(publishedAt, 'MMMM d, yyyy h:mm a')}</div>
          )}
          {lastUpdatedAt && (
            <div className="text-xs text-gray-500">(last updated {formatDistanceToNow(lastUpdatedAt, { addSuffix: true })})</div>
          )}
        </div>
      </div>

      {article.summary && (
        <div className="mb-6 p-4 bg-gray-100 border border-gray-200 rounded">
          <strong className="block text-sm text-gray-600 mb-1">Summary:</strong>
          <p className="text-gray-800">{article.summary}</p>
        </div>
      )}

      <div className="prose max-w-none mx-auto article-content" dangerouslySetInnerHTML={{ __html: article.content || '' }} />

      <div className="mt-8">
        <Link to="/" className="text-accent hover:underline">← Back to home</Link>
      </div>
    </article>
  );
}
