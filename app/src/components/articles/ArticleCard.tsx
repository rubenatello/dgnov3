import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import type { Article } from '../../types/models';
import { estimateReadingTime } from '../../utils/helpers';
import { getArticleUrl} from './getArticleUrl';

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
  const isExclusive = Array.isArray(article.tags) && article.tags.some(tag =>
    typeof tag === 'string' &&
    ['exclusive', 'Exclusive', 'Exclusive.'].includes(tag.trim())
  );

  // Featured: Large hero card
  if (variant === 'featured') {
    return (
      <Link to={getArticleUrl(article)} className="block group relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500">
        <article className="relative">
          {article.featuredImageUrl ? (
            <div className="relative w-full h-64 sm:h-80 md:h-[28rem] overflow-hidden">
              <img 
                src={article.featuredImageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
          ) : (
            <div className="w-full h-64 sm:h-80 md:h-[28rem] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-400 text-lg">No Image</span>
            </div>
          )}
          {isBreaking && (
            <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 z-10 uppercase tracking-wider animate-pulse shadow-lg">
              Breaking News
            </span>
          )}
          {isExclusive && (
            <span className="absolute top-4 right-4 bg-accent text-white text-xs font-bold px-3 py-1.5 z-10 uppercase tracking-wider shadow-lg">
              ★ Exclusive
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 text-white">
            <div className="mb-3">
              {article.section && (
                <span className="text-xs font-bold uppercase tracking-widest text-accent bg-white/10 backdrop-blur-sm px-2 py-1 rounded">
                  {article.section}
                </span>
              )}
            </div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 group-hover:text-accent transition-colors duration-300 leading-tight drop-shadow-lg">
              {article.title}
            </h1>
            {article.summary && (
              <p className="text-base sm:text-lg mb-4 opacity-90 line-clamp-2 max-w-3xl drop-shadow-md">
                {article.summary}
              </p>
            )}
            <div className="flex items-center gap-3 text-sm opacity-80">
              <span className="font-medium">By {article.authorName}</span>
              <span className="text-white/50">•</span>
              <span>{getRelativeTime(publishedAt)}</span>
              <span className="text-white/50">•</span>
              <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-xs">{readingTime}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Secondary: Medium horizontal layout
  if (variant === 'secondary') {
    return (
      <Link to={getArticleUrl(article)} className="block group">
        <article className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200">
          <div className="flex flex-col">
            {article.featuredImageUrl ? (
              <div className="relative w-full h-40 sm:h-48 overflow-hidden">
                <img 
                  src={article.featuredImageUrl} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ) : (
              <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {isBreaking && (
                  <span className="inline-block bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide animate-pulse">
                    Breaking
                  </span>
                )}
                {isExclusive && (
                  <span className="inline-block bg-ink text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                    Exclusive
                  </span>
                )}
                {article.section && !isBreaking && !isExclusive && (
                  <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                    {article.section}
                  </span>
                )}
              </div>
              <h2 className="font-heading font-bold text-lg sm:text-xl mb-2 group-hover:text-accent transition-colors duration-200 leading-tight line-clamp-2">
                {article.title}
              </h2>
              {article.summary && (
                <p className="text-sm text-inkMuted mb-3 line-clamp-2">
                  {article.summary}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-sand">
                <span className="font-medium">By {article.authorName}</span>
                <div className="flex items-center gap-2">
                  <span>{getRelativeTime(publishedAt)}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-accent">{readingTime}</span>
                </div>
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
      <Link to={getArticleUrl(article)} className="block group">
        <article className="border-b border-gray-100 py-4 last:border-b-0 hover:bg-gray-50/50 -mx-2 px-2 rounded transition-colors duration-200">
          <div className="flex items-start gap-2">
            {isBreaking && (
              <span className="inline-flex items-center bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide animate-pulse flex-shrink-0 mt-1">
                Breaking
              </span>
            )}
            {isExclusive && (
              <span className="inline-flex items-center bg-ink text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0 mt-1">
                Exclusive
              </span>
            )}
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-base sm:text-lg mb-1.5 group-hover:text-accent transition-colors duration-200 leading-tight">
                {article.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-sand">
                <span className="font-medium">{article.authorName}</span>
                <span className="text-gray-300">•</span>
                <span>{getRelativeTime(publishedAt)}</span>
                <span className="text-gray-300">•</span>
                <span className="text-accent font-medium">{readingTime}</span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Compact: Small card for sidebar
  return (
    <Link to={getArticleUrl(article)} className="block group">
      <article className="border-b border-gray-100 py-3 last:border-b-0 hover:bg-gray-50/50 -mx-1 px-1 rounded transition-colors duration-200">
        <div className="flex gap-3">
          {article.featuredImageUrl ? (
            <div className="flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 overflow-hidden rounded shadow-sm">
              <img 
                src={article.featuredImageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded shadow-sm">
              <span className="text-gray-400 text-[10px]">No Image</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {isBreaking && (
              <span className="inline-block bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 mb-1 rounded uppercase tracking-wide animate-pulse">
                Breaking
              </span>
            )}
            {isExclusive && (
              <span className="inline-block bg-ink text-white text-[10px] font-bold px-1.5 py-0.5 mb-1 rounded uppercase tracking-wide">
                Exclusive
              </span>
            )}
            <h3 className="font-heading font-semibold text-sm leading-tight line-clamp-2 group-hover:text-accent transition-colors duration-200">
              {article.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-sand mt-1">
              <span>{getRelativeTime(publishedAt)}</span>
              <span className="text-gray-300">•</span>
              <span className="text-accent">{readingTime}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
