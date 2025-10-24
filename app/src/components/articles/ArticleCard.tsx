import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import type { Article } from '../../types/models';
import { estimateReadingTime } from '../../utils/helpers';

function getRelativeTime(dateString: string | Date | Timestamp | undefined): string {
  if (dateString === undefined || dateString === null) return '';
  let date: Date;
  if (dateString instanceof Timestamp) {
    date = dateString.toDate();
  } else if (dateString instanceof Date) {
    date = dateString;
  } else {
    date = new Date(String(dateString));
  }
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

type ArticleCardVariant = 'featured' | 'secondary' | 'compact' | 'list';

interface ArticleCardProps {
  article: Article;
  variant?: ArticleCardVariant;
}

export default function ArticleCard({ article, variant = 'compact' }: ArticleCardProps) {
  const publishedAt = article.publishedAt;
  const _breakingUntil: unknown = article.breakingUntil;
  const breakingUntil = _breakingUntil instanceof Timestamp
    ? _breakingUntil.toDate()
    : _breakingUntil instanceof Date
      ? _breakingUntil
      : _breakingUntil ? new Date(String(_breakingUntil)) : null;
  const isBreaking = breakingUntil ? breakingUntil.getTime() > Date.now() : false;
  const readingTime = estimateReadingTime(article.content || "");

  // Featured: Large hero card
  if (variant === 'featured') {
    return (
      <Link to={`/article/${article.slug}`} className="block group relative">
        <article className="relative">
          {article.featuredImageUrl ? (
            <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
              <img 
                src={article.featuredImageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="w-full h-64 sm:h-80 md:h-96 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          {isBreaking && (
            <span className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 z-10">
              BREAKING
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl mb-2 group-hover:text-accent-light leading-tight">
              {article.title}
            </h1>
            {article.summary && (
              <p className="text-base sm:text-lg mb-3 opacity-90 line-clamp-2">
                {article.summary}
              </p>
            )}
            <div className="flex items-center gap-3 text-sm opacity-80">
              <span>{getRelativeTime(publishedAt)}</span>
              <span>•</span>
              <span>{readingTime}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Secondary: Medium horizontal layout
  if (variant === 'secondary') {
    return (
      <Link to={`/article/${article.slug}`} className="block group">
        <article className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
          <div className="flex gap-4 sm:gap-6">
            {article.featuredImageUrl ? (
              <div className="flex-shrink-0 w-24 h-20 sm:w-32 sm:h-24 md:w-40 md:h-28 overflow-hidden">
                <img 
                  src={article.featuredImageUrl} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-24 h-20 sm:w-32 sm:h-24 md:w-40 md:h-28 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Image</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {isBreaking && (
                <span className="inline-block bg-red-600 text-white text-xs font-bold px-2 py-1 mb-2">
                  BREAKING
                </span>
              )}
              <h2 className="font-heading font-bold text-lg sm:text-xl mb-2 group-hover:text-accent leading-tight">
                {article.title}
              </h2>
              {article.summary && (
                <p className="text-sm sm:text-base text-inkMuted mb-2 line-clamp-2">
                  {article.summary}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-sand">
                <span>{getRelativeTime(publishedAt)}</span>
                <span>•</span>
                <span>{readingTime}</span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // List: Simple text-only layout
  if (variant === 'list') {
    return (
      <Link to={`/article/${article.slug}`} className="block group">
        <article className="border-b border-gray-200 py-3 last:border-b-0">
          {isBreaking && (
            <span className="inline-block bg-red-600 text-white text-xs font-bold px-2 py-1 mb-2">
              BREAKING
            </span>
          )}
          <h3 className="font-heading font-semibold text-base sm:text-lg mb-1 group-hover:text-accent leading-tight">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-sand">
            <span>{getRelativeTime(publishedAt)}</span>
            <span>•</span>
            <span>{readingTime}</span>
          </div>
        </article>
      </Link>
    );
  }

  // Compact: Small card for sidebar
  return (
    <Link to={`/article/${article.slug}`} className="block group">
      <article className="border-b border-gray-200 pb-3 mb-3 last:border-b-0">
        <div className="flex gap-3">
          {article.featuredImageUrl ? (
            <div className="flex-shrink-0 w-16 h-12 sm:w-20 sm:h-16 overflow-hidden">
              <img 
                src={article.featuredImageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-16 h-12 sm:w-20 sm:h-16 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {isBreaking && (
              <span className="inline-block bg-red-600 text-white text-xs font-bold px-2 py-1 mb-1">
                BREAKING
              </span>
            )}
            <h3 className="font-heading font-semibold text-sm sm:text-base mb-1 group-hover:text-accent leading-tight line-clamp-2">
              {article.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-sand">
              <span>{getRelativeTime(publishedAt)}</span>
              <span>•</span>
              <span>{readingTime}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
