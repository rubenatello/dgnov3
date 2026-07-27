import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ArticleCard from '../components/articles/ArticleCard';
import LoadingScreen from '../components/LoadingScreen';
import SEOHead from '../components/SEOHead';
import { getArticlesByAuthor } from '../services/articleService';
import { getPublicAuthor } from '../services/publicAuthorService';
import type { PublicAuthorProfile } from '../services/publicAuthorService';
import type { Article } from '../types/models';
import { SEO_CONFIG } from '../utils/seoConstants';

function isPublicUrl(value?: string): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function AuthorPage() {
  const { authorId = '' } = useParams<{ authorId: string }>();
  const [author, setAuthor] = useState<PublicAuthorProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesError, setArticlesError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setArticlesError(false);
    Promise.allSettled([getPublicAuthor(authorId), getArticlesByAuthor(authorId)])
      .then(([profileResult, articlesResult]) => {
        if (!active) return;
        setAuthor(profileResult.status === 'fulfilled' ? profileResult.value : null);
        setArticles(articlesResult.status === 'fulfilled' ? articlesResult.value : []);
        setArticlesError(articlesResult.status === 'rejected');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [authorId]);

  if (loading) return <LoadingScreen message="Loading author profile…" />;
  if (!author) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 min-h-[60vh]">
        <SEOHead
          title="Author profile unavailable | DGNO"
          description="The requested DGNO author profile is not available."
          url={`${SEO_CONFIG.siteUrl}/author/${encodeURIComponent(authorId)}`}
          robots="noindex, nofollow"
        />
        <h1 className="text-3xl font-bold text-ink">Author profile unavailable</h1>
        <p className="mt-3 text-inkMuted">This byline does not currently have a public profile.</p>
        <Link to="/editorial-standards" className="inline-flex mt-6 text-accent font-semibold underline underline-offset-4">Read DGNO's editorial standards</Link>
      </div>
    );
  }

  const canonicalUrl = `${SEO_CONFIG.siteUrl}/author/${encodeURIComponent(authorId)}`;
  const profileImage = author.profileImageUrl || author.avatarUrl;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[60vh]">
      <SEOHead
        title={`${author.displayName} | DGNO`}
        description={author.bio || `Published reporting by ${author.displayName} at DGNO.`}
        url={canonicalUrl}
        type="website"
      />
      <div className="flex flex-col sm:flex-row gap-6 items-start border-b border-stone/50 pb-8">
        {profileImage ? (
          <img src={profileImage} alt="" width="128" height="128" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover" />
        ) : (
          <div aria-hidden="true" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-accent/15 text-accent flex items-center justify-center text-3xl font-bold">
            {author.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">DGNO contributor</p>
          <h1 className="mt-2 font-heading text-4xl font-bold text-ink">{author.displayName}</h1>
          {author.bio && <p className="mt-3 text-lg text-inkMuted max-w-2xl">{author.bio}</p>}
          {isPublicUrl(author.website) && (
            <a href={author.website} target="_blank" rel="me noopener noreferrer" className="inline-flex mt-4 text-accent font-semibold underline underline-offset-4">Author website</a>
          )}
          <p className="mt-4 text-sm text-inkMuted">
            DGNO's <Link to="/editorial-standards" className="underline underline-offset-4">editorial standards</Link> apply to all published bylines.
          </p>
        </div>
      </div>

      <section className="mt-10" aria-labelledby="author-stories-heading">
        <h2 id="author-stories-heading" className="text-2xl font-bold text-ink">Recent published work</h2>
        {articlesError ? (
          <p role="alert" className="mt-4 text-red-800">Published work could not be loaded right now.</p>
        ) : articles.length ? (
          <div className="mt-4 divide-y divide-stone/40">
            {articles.map((article) => <ArticleCard key={article.id} article={article} variant="list" />)}
          </div>
        ) : (
          <p className="mt-4 text-inkMuted">No published stories are currently associated with this profile.</p>
        )}
      </section>
    </div>
  );
}
