import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticleBySlug, getRelatedArticles } from '../../services/articleService';
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
import BookmarkButton from './BookmarkButton';
import CommentSection from './CommentSection';
import { useAuth } from '../../hooks/useAuth';
import SEOHead from '../SEOHead';
import { SEO_CONFIG, buildBreadcrumbSchema } from '../../utils/seoConstants';
import ArticleCard from './ArticleCard';
import ReadingProgressBar from './ReadingProgressBar';
import ShareButtons from './ShareButtons';

export default function ArticleView() {
  const { slug } = useParams<{ slug: string }>();
  const { userData } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
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

  // Fetch related articles based on tags
  useEffect(() => {
    if (!article?.id || !article?.tags || article.tags.length === 0) {
      setRelatedArticles([]);
      return;
    }
    (async () => {
      try {
        const related = await getRelatedArticles(article.tags!, article.id!, 5);
        setRelatedArticles(related);
      } catch (e) {
        console.warn('Failed to fetch related articles', e);
        setRelatedArticles([]);
      }
    })();
  }, [article?.id, article?.tags]);

  // Add breadcrumb structured data
  useEffect(() => {
    if (!article) return;

    const canonicalUrl = article.slug
      ? `https://dgno.us/article/${article.slug}`
      : `https://dgno.us/article/${slug}`;

    const breadcrumbs = buildBreadcrumbSchema([
      { name: 'Home', url: SEO_CONFIG.siteUrl },
      { name: article.section || 'News', url: `${SEO_CONFIG.siteUrl}/articles/${article.section?.toLowerCase().replace(/ /g, '-')}` },
      { name: article.title, url: canonicalUrl }
    ]);

    const existingBreadcrumb = document.querySelector('script[type="application/ld+json"][data-schema="breadcrumb"]');
    if (existingBreadcrumb) {
      existingBreadcrumb.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'breadcrumb');
    script.textContent = JSON.stringify(breadcrumbs);
    document.head.appendChild(script);

    return () => {
      const cleanup = document.querySelector('script[type="application/ld+json"][data-schema="breadcrumb"]');
      if (cleanup) cleanup.remove();
    };
  }, [article, slug]);

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
        image={article.featuredImageUrl || resolvedImageUrl || 'https://dgno.us/favicon.png'}
        url={canonicalUrl}
        type="article"
        publishedTime={publishedAt?.toISOString()}
        modifiedTime={lastUpdatedAt?.toISOString()}
        author={article.authorName || author?.displayName || 'DGNO Editorial Team'}
        section={article.section}
        tags={tags}
      />
      
      {/* Reading Progress Bar */}
      <ReadingProgressBar />
      
      {/* Main container with sidebar layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Article Content */}
          <article className="lg:col-span-8 xl:col-span-9">
            {/* Section badge */}
            {article.section && (
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full">
                  {article.section}
                </span>
          </div>
        )}
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold leading-tight text-ink mb-4">{article.title}</h1>

      {article.subtitle && (
        <h2 className="text-xl sm:text-2xl text-inkMuted font-light mb-6 leading-relaxed">{article.subtitle}</h2>
      )}

      {(article.featuredImageUrl || article.featuredImageId) && (
  <figure className="mb-8 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden shadow-lg">
    <img
      src={article.featuredImageUrl || resolvedImageUrl || '/default-image.png'}
      alt={article.featuredImageDescription || article.title}
      className="w-full h-auto object-cover"
    />
    {(article.featuredImageDescription || article.featuredImageSourceCredit) && (
      <figcaption className="bg-gray-50 px-4 py-3 border-t border-gray-100">
        {article.featuredImageDescription && (
          <p className="text-sm text-gray-700 leading-relaxed">
            {article.featuredImageDescription}
          </p>
        )}
        {article.featuredImageSourceCredit && (
          <p className="text-xs text-gray-500 mt-1">
            📷 {article.featuredImageSourceCredit}
          </p>
        )}
      </figcaption>
    )}
  </figure>
)}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {author?.profileImageUrl ? (
    <img
      src={author.profileImageUrl}
      alt={author.displayName || 'Author avatar'}
      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 shadow-sm"
      onError={(e) => {
        // Hide broken image and show initials
        e.currentTarget.style.display = 'none';
        const initials = e.currentTarget.nextElementSibling as HTMLElement;
        if (initials) initials.style.display = 'flex';
      }}
    />
  ) : (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center text-white text-sm font-bold ring-2 ring-gray-100 shadow-sm">
      {author?.displayName
        ? author.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '??'}
    </div>
  )}
          <div>
            {article.authorName && <p className="font-semibold text-ink">By {article.authorName}</p>}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="bg-accent/10 text-accent font-medium px-2 py-0.5 rounded">{estimateReadingTime(article.content || "")}</span>
            </div>
          </div>
        </div>
        <div className="text-right text-sm">
          {publishedAt && (
            <div className="text-ink font-medium">{format(publishedAt, 'MMMM d, yyyy')}</div>
          )}
          {lastUpdatedAt && (
            <div className="text-xs text-gray-500 mt-1">Updated {formatDistanceToNow(lastUpdatedAt, { addSuffix: true })}</div>
          )}
        </div>
      </div>

      {article.summary && (
        <div className="mb-8 p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-l-4 border-accent rounded-r-lg">
          <strong className="block text-xs font-bold text-accent uppercase tracking-wide mb-2">Key Points</strong>
          <p className="text-gray-800 leading-relaxed text-lg">{article.summary}</p>
        </div>
      )}

      <div className="prose max-w-none mx-auto article-content" dangerouslySetInnerHTML={{ __html: article.content || '' }} />
      
      {/* Hydrate embeds after content is rendered */}
      <HydrateEmbeds deps={article?.content ? [article.content] : undefined} />

      {tags.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-200">
          <strong className="block text-xs font-bold tracking-widest mb-3 uppercase text-gray-500">
            Filed Under
          </strong>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-accent hover:text-white px-3 py-1.5 rounded-full transition-colors duration-200 cursor-pointer">
                {tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Article engagement section */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <div className="flex flex-col gap-6">
          {/* Stats row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {article.id && (
                <LikeButton 
                  articleId={article.id} 
                  initialLikeCount={article.likeCount || 0}
                />
              )}
              {article.id && (
                <BookmarkButton articleId={article.id} />
              )}
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                  <span>👁</span> {article.viewCount || 0} views
                </span>
                {article.commentCount !== undefined && article.commentCount > 0 && (
                  <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                    <span>💬</span> {article.commentCount} comments
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="text-sm font-medium text-accent hover:text-accent/80 flex items-center gap-1 transition-colors">
                <span>←</span> Back to home
              </Link>
              <button
                type="button"
                className="text-sm font-medium text-gray-500 hover:text-accent flex items-center gap-1 transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <span>↑</span> Top
              </button>
            </div>
          </div>
          
          {/* Share buttons row */}
          <ShareButtons 
            title={article.title}
            url={canonicalUrl}
            summary={article.summary}
          />
        </div>
      </div>

      {/* Related Articles - Mobile Only (shown below article) */}
      {relatedArticles.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-200 lg:hidden">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📖</span>
            <h3 className="text-lg font-bold text-ink uppercase tracking-wide">You Might Also Like</h3>
          </div>
          <div className="space-y-0">
            {relatedArticles.map((relatedArticle) => (
              <ArticleCard key={relatedArticle.id} article={relatedArticle} variant="list" />
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      {article.id && (
        <CommentSection 
          articleId={article.id} 
          articleAuthorId={article.authorId}
        />
      )}
    </article>

    {/* Sidebar - Desktop Only */}
    <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
      <div className="sticky top-24 space-y-8">
        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section>
            <div className="flex items-center gap-2 border-b-2 border-accent pb-2 mb-4">
              <span className="text-lg">📖</span>
              <h3 className="text-base font-bold text-ink uppercase tracking-wide">You Might Also Like</h3>
            </div>
            <div className="space-y-0">
              {relatedArticles.map((relatedArticle) => (
                <ArticleCard key={relatedArticle.id} article={relatedArticle} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
    
        </div>
      </div>
    </>
  );
}
