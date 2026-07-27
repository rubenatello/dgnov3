import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Article } from '../../types/models';
import { trackSearchEvent, isAnalyticsEnabled } from '../../lib/analytics';
import { getArticleUrl } from '../articles/getArticleUrl';
import Dialog from '../ui/Dialog';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  articles: Article[];
}

function useIsMac() {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const platform = navigator.platform?.toLowerCase() || '';
    return platform.includes('mac') || navigator.userAgent.toLowerCase().includes('mac');
  }, []);
}

export default function SearchModal({ open, onClose, articles }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const listId = `search-results-${useId().replace(/:/g, '')}`;
  const modifierKey = useIsMac() ? '⌘' : 'Ctrl';

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setIsSearching(false);
      setSelectedIndex(-1);
      return;
    }

    setIsSearching(true);
    const searchTimeout = window.setTimeout(() => {
      const normalizedQuery = trimmedQuery.toLowerCase();
      const filteredResults = articles
        .filter((article) => {
          const searchable = [
            article.title,
            article.subtitle,
            article.summary,
            article.section,
            ...(article.tags || []),
          ].filter(Boolean).join(' ').toLowerCase();
          return article.status === 'published' && searchable.includes(normalizedQuery);
        })
        .sort((a, b) => {
          const aTitleMatch = a.title.toLowerCase().includes(normalizedQuery);
          const bTitleMatch = b.title.toLowerCase().includes(normalizedQuery);
          if (aTitleMatch !== bTitleMatch) return aTitleMatch ? -1 : 1;
          const aTime = a.publishedAt && 'toMillis' in a.publishedAt ? a.publishedAt.toMillis() : 0;
          const bTime = b.publishedAt && 'toMillis' in b.publishedAt ? b.publishedAt.toMillis() : 0;
          return bTime - aTime;
        })
        .slice(0, 8);

      setResults(filteredResults);
      setSelectedIndex(-1);
      setIsSearching(false);
      try {
        if (isAnalyticsEnabled()) trackSearchEvent(normalizedQuery, filteredResults.length);
      } catch (error) {
        console.warn('trackSearchEvent failed', error);
      }
    }, 300);

    return () => window.clearTimeout(searchTimeout);
  }, [articles, query]);

  useEffect(() => {
    if (selectedIndex < 0 || !resultsRef.current) return;
    resultsRef.current.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const closeAndReset = () => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((index) => Math.max(index - 1, -1));
    } else if (event.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      event.preventDefault();
      window.location.assign(getArticleUrl(results[selectedIndex]));
      closeAndReset();
    }
  };

  const activeOptionId = selectedIndex >= 0 ? `${listId}-option-${selectedIndex}` : undefined;

  return (
    <Dialog
      open={open}
      onClose={closeAndReset}
      title="Search DGNO"
      initialFocusRef={inputRef}
      className="w-full max-w-2xl overflow-hidden rounded-xl border border-stone"
    >
      <div className="flex items-center justify-between gap-4 border-b border-stone px-4 py-3 sm:px-5">
        <h2 className="text-lg font-bold text-ink">Search DGNO</h2>
        <button type="button" onClick={closeAndReset} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-light hover:text-ink" aria-label="Close search">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="border-b border-stone p-4 sm:p-5">
        <label htmlFor={`${listId}-input`} className="sr-only">Search published articles</label>
        <div className="flex items-center gap-3 rounded-lg border border-stone bg-surface px-3 focus-within:border-accent-strong focus-within:ring-2 focus-within:ring-accent-strong/25">
          <svg className="h-5 w-5 flex-none text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
          </svg>
          <input
            ref={inputRef}
            id={`${listId}-input`}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={results.length > 0}
            aria-activedescendant={activeOptionId}
            className="min-w-0 flex-1 bg-transparent py-3 text-base text-ink outline-none placeholder:text-ink-muted"
            placeholder="Search articles"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="rounded-md p-2 text-ink-muted hover:bg-stone-light hover:text-ink" aria-label="Clear search">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[60dvh] overflow-y-auto">
        <div className="flex min-h-10 items-center justify-between border-b border-stone bg-stone-light px-4 py-2 text-xs text-ink-muted" aria-live="polite">
          <span>{isSearching ? 'Searching…' : query.trim() ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Search by headline, section, or topic'}</span>
          <span className="hidden sm:inline">↑↓ navigate · Enter select · Esc close</span>
        </div>

        {results.length > 0 ? (
          <ul ref={resultsRef} id={listId} role="listbox" aria-label="Article search results" className="divide-y divide-stone">
            {results.map((article, index) => (
              <li key={article.id || article.slug}>
                <a
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  href={getArticleUrl(article)}
                  onClick={closeAndReset}
                  className={`flex items-start gap-4 p-4 transition-colors sm:p-5 ${index === selectedIndex ? 'bg-accent-soft' : 'hover:bg-stone-light'}`}
                >
                  {article.featuredImageUrl ? (
                    <img src={article.featuredImageUrl} alt="" loading="lazy" className="h-16 w-20 flex-none rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-16 w-20 flex-none items-center justify-center rounded-lg bg-stone-light text-xs text-ink-muted">No image</div>
                  )}
                  <span className="min-w-0 flex-1">
                    <strong className="line-clamp-2 block text-sm leading-snug text-ink">{article.title}</strong>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                      {article.section && <span className="rounded-full bg-accent-soft px-2 py-0.5 font-bold text-accent-dark">{article.section}</span>}
                      {article.authorName && <span>By {article.authorName}</span>}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : query.trim() && !isSearching ? (
          <div className="px-5 py-12 text-center">
            <p className="font-bold text-ink">No articles found</p>
            <p className="mt-1 text-sm text-ink-muted">Try a broader topic or check the spelling.</p>
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-ink-muted">
            Press <kbd className="rounded border border-stone bg-stone-light px-1.5 py-0.5 font-semibold">{modifierKey}</kbd> + <kbd className="rounded border border-stone bg-stone-light px-1.5 py-0.5 font-semibold">K</kbd> anywhere to open search.
          </div>
        )}
      </div>
    </Dialog>
  );
}
