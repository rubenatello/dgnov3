import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticleBySlug } from '../../services/articleService';
import { getMediaById } from '../../services/mediaService';
import { getUserById } from '../../services/userService';
import { trackArticleView } from '../../services/analyticsService';
import type { Article, User } from '../../types/models';
import { formatDistanceToNow, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import LoadingScreen from '../LoadingScreen';
import { estimateReadingTime } from '../../utils/helpers';
import { HydrateEmbeds } from '../embeds/article-embed';
import LikeButton from './LikeButton';
import { useAuth } from '../../hooks/useAuth';
import SEOHead from '../SEOHead';

export default function ArticleView() {
  const { slug } = useParams<{ slug: string }>();
  const { userData } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const tags = article?.tags ?? [];


  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    const MIN_DELAY = 800; // ms: prevents brief error flash on fast transitions
    const started = performance.now();

    getArticleBySlug(slug)
      .then(a => {
        if (!a) {
          setError('Article not found');
        } else {
          setArticle(a);
          // Track article view
          if (a.id) {
            trackArticleView(a.id, userData?.id);
          }
        }
      })
      .catch(err => setError(String(err)))
      .finally(async () => {
        const elapsed = performance.now() - started;
        const remaining = MIN_DELAY - elapsed;
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
        setLoading(false);
      });
  }, [slug, userData?.id]);

  // If the article references a media ID but no explicit URL, resolve it once.
  useEffect(() => {
    (async () => {
      if (!article) return;
      // Reset whenever the article changes
      setResolvedImageUrl(null);
      if (!article.featuredImageUrl && article.featuredImageId) {
        try {
          const media = await getMediaById(article.featuredImageId);
          if (media?.url) setResolvedImageUrl(media.url);
        } catch (e) {
          // Non-fatal: leave as null and UI will fallback to placeholder
          console.warn('Failed to resolve media URL from featuredImageId', e);
        }
      }
    })();
  }, [article]);

  useEffect(() => {
  if (!article?.authorId || typeof article.authorId !== 'string') return;
  (async () => {
    const author = await getUserById(article.authorId!);
    setAuthor(author);
  })();
}, [article?.authorId]);

  if (loading) return <LoadingScreen message="Loading article…" />;
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

  // Construct canonical URL from article slug
  const canonicalUrl = article.slug 
    ? `https://dgno.us/article/${article.slug}`
    : `https://dgno.us/article/${slug}`;

  return (
    <>
      <SEOHead
        title={`${article.title} | DGNO`}
        description={article.summary || article.subtitle || `${article.title} - Independent journalism from DGNO`}
        image={article.featuredImageUrl || resolvedImageUrl || 'https://dgno.us/og-image.png'}
        url={canonicalUrl}
        type="article"
        publishedTime={publishedAt?.toISOString()}
        modifiedTime={lastUpdatedAt?.toISOString()}
        author={article.authorName || author?.displayName || 'DGNO Editorial Team'}
        section={article.section}
        tags={tags}
      />
      <article className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">{article.title}</h1>

      {article.subtitle && (
        <h2 className="text-xl text-gray-700 mb-4">{article.subtitle}</h2>
      )}

      {(article.featuredImageUrl || article.featuredImageId) && (
  <div className="mb-6 text-center relative group">
    <img
      src={article.featuredImageUrl || resolvedImageUrl || '/default-image.png'}
      alt={article.title}
      className="mx-auto max-w-full h-auto transition duration-300 group-hover:brightness-75 group-hover:scale-100"
      style={{ display: 'block' }}
    />
    {(article.featuredImageDescription || article.featuredImageSourceCredit) && (
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/70 via-black/40 to-transparent rounded">
        {article.featuredImageDescription && (
          <div className="text-white text-base font-semibold drop-shadow-lg mb-2 px-6">
            {article.featuredImageDescription}
          </div>
        )}
        {article.featuredImageSourceCredit && (
          <div className="text-white text-xs drop-shadow-lg px-4">
            Source: {article.featuredImageSourceCredit}
          </div>
        )}
      </div>
    )}
  </div>
)}

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
        <div className="mb-2 sm:mb-0 flex items-center gap-2">
          {author?.profileImageUrl ? (
    <img
      src={author.profileImageUrl}
      alt={author.displayName || 'Author avatar'}
      className="w-12 h-12 rounded-full object-cover"
      onError={(e) => {
        // Hide broken image and show initials
        e.currentTarget.style.display = 'none';
        const initials = e.currentTarget.nextElementSibling as HTMLElement;
        if (initials) initials.style.display = 'flex';
      }}
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">
      {author?.displayName
        ? author.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '??'}
    </div>
  )}
          {article.authorName && <span className="mr-2">By {article.authorName}</span>}
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">{estimateReadingTime(article.content || "")}</span>
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
      
      {/* Hydrate embeds after content is rendered */}
      <HydrateEmbeds deps={article?.content ? [article.content] : undefined} />

      {tags.length > 0 && (
        <div className="mt-8">
          <strong className="block text-xs font-bold tracking-wide mb-1 uppercase text-gray-700">
            FILED UNDER:
          </strong>
          <div className="text-xs font-regular text-gray-800 flex flex-wrap gap-x-2 gap-y-1 narrow italic">
            {tags.map((tag, idx) => (
              <span key={tag} className="text-gray-500 uppercase">
                {tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                {idx < tags.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Article engagement section */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {article.id && (
            <LikeButton 
              articleId={article.id} 
              initialLikeCount={article.likeCount || 0}
            />
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>👁 {article.viewCount || 0} views</span>
            {article.commentCount !== undefined && (
              <span>💬 {article.commentCount} comments</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-accent hover:underline">← Back to home</Link>
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑ Back to Top
          </button>
        </div>
      </div>
    </article>
    </>
  );
}
