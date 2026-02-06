import { useState, useEffect, useRef, useMemo } from 'react';
import type { Article } from '../../types/models';
import { trackSearchEvent, isAnalyticsEnabled } from '../../lib/analytics';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  articles: Article[];
}

// Detect if user is on macOS
function useIsMac() {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    // Check for Mac in platform or userAgentData
    const platform = navigator.platform?.toLowerCase() || '';
    const userAgent = navigator.userAgent?.toLowerCase() || '';
    return platform.includes('mac') || userAgent.includes('mac');
  }, []);
}

export default function SearchModal({ open, onClose, articles }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const isMac = useIsMac();
  
  // Get the modifier key display based on OS
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [open]);

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!open) {
          // This would need to be handled by parent - emit an event or use context
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [open]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setIsSearching(false);
      setSelectedIndex(-1);
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
      setSelectedIndex(-1);
      // track the search event (best-effort)
      try {
        if (isAnalyticsEnabled()) trackSearchEvent(q, filteredResults.length);
      } catch (err) {
        // don't let analytics break search
        console.warn('trackSearchEvent failed', err);
      }
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
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      window.location.href = `/article/${results[selectedIndex].slug}`;
      handleResultClick();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-0 left-0 w-full flex justify-center z-[9999] pointer-events-none px-4">
        <div className="mt-[10vh] w-full max-w-2xl bg-white rounded-xl shadow-2xl pointer-events-auto overflow-hidden border border-gray-200">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                className="flex-1 text-lg text-ink placeholder-gray-400 focus:outline-none bg-transparent"
                placeholder="Search articles..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded border border-gray-200">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query.trim() && (
              <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span>
                  {isSearching ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    `${results.length} result${results.length !== 1 ? 's' : ''} found`
                  )}
                </span>
                <span className="hidden sm:inline text-gray-400">
                  ↑↓ to navigate • Enter to select
                </span>
              </div>
            )}

            {results.length > 0 ? (
              <ul ref={resultsRef} className="divide-y divide-gray-100">
                {results.map((article, index) => (
                  <li 
                    key={article.id} 
                    className={`transition-colors ${
                      index === selectedIndex 
                        ? 'bg-accent/10' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <a
                      href={`/article/${article.slug}`}
                      className="flex items-start gap-4 p-4"
                      onClick={handleResultClick}
                    >
                      {article.featuredImageUrl ? (
                        <img 
                          src={article.featuredImageUrl} 
                          alt={article.title} 
                          className="h-16 w-20 rounded-lg object-cover flex-shrink-0 shadow-sm" 
                        />
                      ) : (
                        <div className="h-16 w-20 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-ink text-sm leading-tight mb-1 line-clamp-2">
                          {article.title}
                        </h4>
                        {article.subtitle && (
                          <p className="text-gray-600 text-xs leading-tight mb-2 line-clamp-1">
                            {article.subtitle}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          {article.section && (
                            <span className="bg-accent/20 text-accent font-medium px-2 py-0.5 rounded-full">
                              {article.section}
                            </span>
                          )}
                          {article.publishedAt && (
                            <span className="text-gray-400">
                              {new Date(article.publishedAt.toMillis()).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                          {article.authorName && (
                            <span className="text-gray-400">
                              by {article.authorName}
                            </span>
                          )}
                        </div>
                      </div>
                      {index === selectedIndex && (
                        <div className="flex-shrink-0 self-center">
                          <kbd className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded border border-gray-200">
                            ↵
                          </kbd>
                        </div>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            ) : query.trim() && !isSearching ? (
              <div className="text-center py-12 px-4">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium text-gray-700 mb-1">No articles found</p>
                <p className="text-sm text-gray-500">Try different keywords or check your spelling</p>
              </div>
            ) : !query.trim() ? (
              <div className="text-center py-12 px-4">
                <div className="text-4xl mb-3">💡</div>
                <p className="font-medium text-gray-700 mb-1">Start typing to search articles...</p>
                <p className="text-sm text-gray-500">Search by title, section, or keywords</p>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">{modifierKey}</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">K</kbd>
                    <span className="ml-1">to open</span>
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
