import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticleBySlug, getRelatedArticles } from '../../services/articleService';
import { getMediaById } from '../../services/mediaService';
import { getPublicAuthor } from '../../services/publicAuthorService';
import { trackArticleView } from '../../services/analyticsService';
import type { Article } from '../../types/models';
import type { PublicAuthorProfile } from '../../services/publicAuthorService';
import { formatDistanceToNow, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import LoadingScreen from '../LoadingScreen';
import { estimateReadingTime, slugifyTag } from '../../utils/helpers';
import { HydrateEmbeds } from '../embeds/article-embed';
import LikeButton from './LikeButton';
import BookmarkButton from './BookmarkButton';
import CommentSection from './CommentSection';
import SEOHead from '../SEOHead';
import { SEO_CONFIG, buildBreadcrumbSchema } from '../../utils/seoConstants';
import ArticleCard from './ArticleCard';
import ReadingProgressBar from './ReadingProgressBar';
import ShareButtons from './ShareButtons';
import { getArticleUrl } from './getArticleUrl';
import { isAnalyticsEnabled } from '../../lib/analytics';

function isSafePublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function ArticleView() {
  const { slug, yyyy, mm, dd } = useParams<{ slug: string; yyyy: string; mm: string; dd: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [author, setAuthor] = useState<PublicAuthorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const tags = article?.tags ?? [];


  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setError(null);
    setArticle(null);
    setAuthor(null);
    const legacyDatePath = yyyy && mm && dd ? `${yyyy}/${mm}/${dd}` : undefined;

    getArticleBySlug(slug, legacyDatePath)
      .then(a => {
        if (!active) return;
        if (!a) {
          setError('Article not found');
        } else {
          setArticle(a);
          // Track article view
          if (a.id && isAnalyticsEnabled()) {
            trackArticleView(a.id);
          }
        }
      })
      .catch((caught) => {
        console.error('Article failed to load', caught);
        if (active) setError('This article could not be loaded right now.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug, yyyy, mm, dd]);

  // If the article references a media ID but no explicit URL, resolve it once.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!article) return;
      // Reset whenever the article changes
      setResolvedImageUrl(null);
      if (!article.featuredImageUrl && article.featuredImageId) {
        try {
          const media = await getMediaById(article.featuredImageId);
          if (active && media?.url) setResolvedImageUrl(media.url);
        } catch (e) {
          // Non-fatal: leave as null and UI will fallback to placeholder
          console.warn('Failed to resolve media URL from featuredImageId', e);
        }
      }
    })();
    return () => { active = false; };
  }, [article]);

  useEffect(() => {
    if (!article?.authorId || typeof article.authorId !== 'string') return;
    let active = true;
    getPublicAuthor(article.authorId)
      .then((profile) => active && setAuthor(profile))
      .catch((caught) => console.warn('Author profile failed to load', caught));
    return () => { active = false; };
  }, [article?.authorId]);

  // Fetch related articles based on tags
  useEffect(() => {
    if (!article?.id || !article?.tags || article.tags.length === 0) {
      setRelatedArticles([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const related = await getRelatedArticles(article.tags!, article.id!, 5);
        if (active) setRelatedArticles(related);
      } catch (e) {
        console.warn('Failed to fetch related articles', e);
        if (active) setRelatedArticles([]);
      }
    })();
    return () => { active = false; };
  }, [article?.id, article?.tags]);

  // Add breadcrumb structured data
  useEffect(() => {
    if (!article) return;

    const canonicalUrl = new URL(getArticleUrl(article), SEO_CONFIG.siteUrl).toString();

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

  const requestedPath = yyyy && mm && dd
    ? `/article/${yyyy}/${mm}/${dd}/${encodeURIComponent(slug || '')}`
    : `/article/${encodeURIComponent(slug || '')}`;

  if (loading) return <LoadingScreen message="Loading article…" />;
  if (error || !article) return (
    <div className="max-w-3xl mx-auto px-4 py-16 min-h-[60vh]">
      <SEOHead
        title="Article unavailable | DGNO"
        description="The requested DGNO article could not be loaded."
        url={`${SEO_CONFIG.siteUrl}${requestedPath}`}
        robots="noindex, nofollow"
      />
      <h1 className="text-3xl font-bold text-ink">{error === 'Article not found' || !article ? 'Article not found' : 'Article unavailable'}</h1>
      <p className="mt-3 text-inkMuted">{error || 'The requested article is not available.'}</p>
      <Link to="/" className="inline-flex mt-6 text-accent font-semibold underline underline-offset-4">Return to the homepage</Link>
    </div>
  );

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

  const canonicalPath = getArticleUrl(article);
  const canonicalUrl = new URL(canonicalPath, SEO_CONFIG.siteUrl).toString();
  const sectionPath = article.section ? `/articles/${slugifyTag(article.section)}` : '/';
  const authorName = article.authorName || author?.displayName || null;
  const authorPath = article.authorId ? `/author/${encodeURIComponent(article.authorId)}` : null;
  const coAuthorPath = article.coAuthorId ? `/author/${encodeURIComponent(article.coAuthorId)}` : null;
  const authorImage = author?.profileImageUrl || author?.avatarUrl;
  const readingTime = article.wordCount
    ? `${Math.max(1, Math.ceil(article.wordCount / 200))} min read`
    : estimateReadingTime(article.content || '');
  const evidence = article.editorialEvidence;

  return (
    <>
      <SEOHead
        title={`${article.title} | DGNO`}
        description={article.summary || article.subtitle || `${article.title} - Independent journalism from DGNO`}
        image={article.socialImageUrl || article.featuredImageUrl || resolvedImageUrl || 'https://dgno.us/logo.png'}
        url={canonicalUrl}
        type="article"
        publishedTime={publishedAt?.toISOString()}
        modifiedTime={lastUpdatedAt?.toISOString()}
        author={authorName || undefined}
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
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-inkMuted">
              <ol className="flex flex-wrap items-center gap-2">
                <li><Link to="/" className="hover:text-accent">Home</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link to={sectionPath} className="hover:text-accent">{article.section || 'News'}</Link></li>
                <li aria-hidden="true">/</li>
                <li className="truncate max-w-[18rem]" aria-current="page">{article.title}</li>
              </ol>
            </nav>
            {/* Section badge */}
            {article.section && (
              <div className="mb-4">
                <Link to={sectionPath} className="inline-flex text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full hover:bg-accent hover:text-white">
                  {article.section}
                </Link>
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
      loading="eager"
      fetchPriority="high"
      decoding="async"
      width="1600"
      height="900"
      className="w-full aspect-video object-cover"
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
          {authorImage ? (
    <img
      src={authorImage}
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
      {authorName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
    </div>
  )}
          <div>
            <p className="font-semibold text-ink">
              {authorName ? <>
                By {authorPath ? <Link to={authorPath} rel="author" className="underline decoration-stone/60 underline-offset-4 hover:text-accent">{authorName}</Link> : authorName}
              </> : 'Byline unavailable'}
              {article.coAuthorName && <> and {coAuthorPath ? <Link to={coAuthorPath} rel="author" className="underline decoration-stone/60 underline-offset-4 hover:text-accent">{article.coAuthorName}</Link> : article.coAuthorName}</>}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="bg-accent/10 text-accent font-medium px-2 py-0.5 rounded">{readingTime}</span>
            </div>
          </div>
        </div>
        <div className="text-right text-sm">
          {publishedAt && (
            <time className="block text-ink font-medium" dateTime={publishedAt.toISOString()}>
              Published {format(publishedAt, 'MMMM d, yyyy')}
            </time>
          )}
          {lastUpdatedAt && (
            <time className="block text-xs text-gray-500 mt-1" dateTime={lastUpdatedAt.toISOString()}>
              Record updated {formatDistanceToNow(lastUpdatedAt, { addSuffix: true })}
            </time>
          )}
        </div>
      </div>

      {article.summary && (
        <div className="mb-8 p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-l-4 border-accent rounded-r-lg">
          <strong className="block text-xs font-bold text-accent uppercase tracking-wide mb-2">Key Points</strong>
          <p className="text-gray-800 leading-relaxed text-lg">{article.summary}</p>
        </div>
      )}

      <div className="prose max-w-3xl mx-auto article-content" dangerouslySetInnerHTML={{ __html: article.content || '' }} />
      
      {/* Hydrate embeds after content is rendered */}
      <HydrateEmbeds deps={article?.content ? [article.content] : undefined} />

      {evidence?.sources?.length ? (
        <section className="mt-10 p-5 sm:p-6 rounded-xl border border-stone/50 bg-paper" aria-labelledby="article-sources-heading">
          <h2 id="article-sources-heading" className="text-lg font-bold text-ink">Sources and reporting record</h2>
          <p className="mt-2 text-sm text-inkMuted">
            These links are attached to DGNO's editorial evidence record. Source type describes the source, not an endorsement of every claim it makes.
          </p>
          <ul className="mt-4 space-y-3">
            {evidence.sources.map((source) => (
              <li key={`${source.url}-${source.title}`} className="text-sm">
                {isSafePublicUrl(source.url) ? (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-4 break-words">{source.title}</a>
                ) : <span className="font-semibold text-ink">{source.title}</span>}
                <span className="block text-inkMuted">{source.publisher} · {source.kind}</span>
              </li>
            ))}
          </ul>
          {evidence.approvedAt && (
            <p className="mt-4 text-xs text-inkMuted">
              Editorial review recorded <time dateTime={evidence.approvedAt}>{format(new Date(evidence.approvedAt), 'MMMM d, yyyy')}</time>.
            </p>
          )}
        </section>
      ) : null}

      {tags.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-200">
          <strong className="block text-xs font-bold tracking-widest mb-3 uppercase text-gray-500">
            Filed Under
          </strong>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link key={tag} to={`/tag/${slugifyTag(tag)}`} className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-accent hover:text-white px-3 py-1.5 rounded-full transition-colors duration-200">
                {tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Link>
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

      <section className="mt-10 overflow-hidden rounded-2xl border border-stone/60 bg-surface-raised shadow-soft" aria-labelledby="keep-following-heading">
        <div className="border-b border-stone/50 bg-masthead px-5 py-6 text-on-masthead sm:px-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-accent-light">Keep following the record</p>
          <h2 id="keep-following-heading" className="mt-2 font-heading text-2xl font-bold text-white">Go beyond one headline.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-masthead-muted">Inspect DGNO's public data, read the latest reporting, or follow the site directly—no paywall or inbox required.</p>
        </div>
        <div className="grid divide-y divide-stone/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Link to="/trackers" className="p-5 font-bold text-ink transition hover:bg-accent-soft hover:text-accent-dark">Explore trackers →</Link>
          <Link to="/" className="p-5 font-bold text-ink transition hover:bg-accent-soft hover:text-accent-dark">Latest reporting →</Link>
          <a href="/rss.xml" className="p-5 font-bold text-ink transition hover:bg-accent-soft hover:text-accent-dark">Follow by RSS →</a>
        </div>
      </section>

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
