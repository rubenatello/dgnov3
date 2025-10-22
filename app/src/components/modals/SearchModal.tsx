import { useState, useEffect } from 'react';
import type { Article } from '../../types/models';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  articles: Article[];
}

export default function SearchModal({ open, onClose, articles }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const searchTimeout = setTimeout(() => {
      const q = query.toLowerCase().trim();
      const filteredResults = articles
        .filter((article: Article) => {
          // Search in title, subtitle, summary, section, and tags
          const searchFields = [
            article.title,
            article.subtitle,
            article.summary,
            article.section,
            ...(article.tags || [])
          ].filter(Boolean).join(' ').toLowerCase();
          
          return searchFields.includes(q);
        })
        .filter(article => article.status === 'published') // Only show published articles
        .sort((a, b) => {
          // Prioritize title matches over other fields
          const aTitle = a.title.toLowerCase().includes(q);
          const bTitle = b.title.toLowerCase().includes(q);
          if (aTitle && !bTitle) return -1;
          if (!aTitle && bTitle) return 1;
          
          // Then sort by publish date (newest first)
          if (a.publishedAt && b.publishedAt) {
            return b.publishedAt.toMillis() - a.publishedAt.toMillis();
          }
          return 0;
        })
        .slice(0, 8); // Limit to 8 results for performance

      setResults(filteredResults);
      setIsSearching(false);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(searchTimeout);
  }, [query, articles]);

  const handleResultClick = () => {
    setQuery('');
    setResults([]);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed top-0 left-0 w-full flex justify-center z-[9999] pointer-events-none">
      <div className="mt-4 w-full max-w-lg bg-white border border-stone rounded-lg shadow-xl p-4 pointer-events-auto">
        <div className="flex items-center mb-3">
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full border border-stone rounded-l-md px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Search articles by title, topic, section..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-ink hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>
          <button
            className="bg-accent text-white px-4 py-2.5 rounded-r-md font-heading hover:bg-accent/90 transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {query.trim() && (
          <div className="text-xs text-ink mb-2">
            {isSearching ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
          </div>
        )}

        {results.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto divide-y divide-stone/20 border border-stone/10 rounded-md">
            {results.map(article => (
              <li key={article.id} className="hover:bg-accent/10 transition-colors">
                <a
                  href={`/article/${article.slug}`}
                  className="flex items-start gap-3 p-3 block text-decoration-none"
                  onClick={handleResultClick}
                >
                  {article.featuredImageUrl && (
                    <img 
                      src={article.featuredImageUrl} 
                      alt={article.title} 
                      className="h-12 w-12 rounded object-cover flex-shrink-0 mt-1" 
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-ink hover:text-accent font-medium text-sm leading-tight mb-1 truncate">
                      {article.title}
                    </h4>
                    {article.subtitle && (
                      <p className="text-ink text-xs leading-tight mb-1 line-clamp-2">
                        {article.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-ink">
                      {article.section && (
                        <span className="bg-accent/30 px-2 py-0.5 rounded-full">
                          {article.section}
                        </span>
                      )}
                      {article.publishedAt && (
                        <span>
                          {new Date(article.publishedAt.toMillis()).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        ) : query.trim() && !isSearching ? (
          <div className="text-ink text-center py-8 border border-stone/10 rounded-md bg-accent/5">
            <div className="text-2xl mb-2">🔍</div>
            <p>No articles found for "{query}"</p>
            <p className="text-xs mt-1">Try different keywords or check spelling</p>
          </div>
        ) : query.trim() ? (
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : null}

        {!query.trim() && (
          <div className="text-ink text-center py-6 text-sm">
            <div className="text-2xl mb-2">💡</div>
            <p>Start typing to search articles...</p>
            <p className="text-xs mt-1">Search by title, section, or keywords</p>
          </div>
        )}
      </div>
    </div>
  );
}
