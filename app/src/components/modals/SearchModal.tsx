import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { trackSearchEvent, isAnalyticsEnabled } from '../../lib/analytics';
import {
  searchPublicSite,
  type PublicSearchResult,
} from '../../services/publicSearchService';
import Dialog from '../ui/Dialog';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

function useIsMac() {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const platform = navigator.platform?.toLowerCase() || '';
    return platform.includes('mac') || navigator.userAgent.toLowerCase().includes('mac');
  }, []);
}

function resultDate(result: PublicSearchResult): string | null {
  const value = result.updatedAt || result.publishedAt;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const listId = `search-results-${useId().replace(/:/g, '')}`;
  const modifierKey = useIsMac() ? '⌘' : 'Ctrl';

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSearchError(null);
      setSelectedIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      setSelectedIndex(-1);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    setSearchError(null);
    const searchTimeout = window.setTimeout(() => {
      searchPublicSite(trimmedQuery, 'all', 8, controller.signal)
        .then((payload) => {
          setResults(payload.results);
          setSelectedIndex(-1);
          if (isAnalyticsEnabled()) {
            trackSearchEvent(trimmedQuery.toLowerCase(), payload.total);
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setResults([]);
          setSearchError(error instanceof Error ? error.message : 'Search is temporarily unavailable.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(searchTimeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (selectedIndex < 0 || !resultsRef.current) return;
    resultsRef.current.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const closeAndReset = () => {
    setQuery('');
    setResults([]);
    setSearchError(null);
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
      window.location.assign(results[selectedIndex].url);
      closeAndReset();
    }
  };

  const activeOptionId = selectedIndex >= 0 ? `${listId}-option-${selectedIndex}` : undefined;
  const allResultsUrl = `/search?${new URLSearchParams({ q: query.trim() }).toString()}`;

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
        <label htmlFor={`${listId}-input`} className="sr-only">Search DGNO reporting and public data</label>
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
            placeholder="Search reporting, trackers, and investigations"
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
          <span>
            {isSearching
              ? 'Searching…'
              : searchError
                ? searchError
                : query.trim().length >= 2
                  ? `${results.length} result${results.length === 1 ? '' : 's'}`
                  : 'Search headlines, topics, trackers, and public resources'}
          </span>
          <span className="hidden sm:inline">↑↓ navigate · Enter select · Esc close</span>
        </div>

        {results.length > 0 ? (
          <>
            <ul ref={resultsRef} id={listId} role="listbox" aria-label="DGNO search results" className="divide-y divide-stone">
              {results.map((result, index) => {
                const date = resultDate(result);
                return (
                  <li key={result.id}>
                    <a
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      href={result.url}
                      onClick={closeAndReset}
                      className={`flex items-start gap-4 p-4 transition-colors sm:p-5 ${index === selectedIndex ? 'bg-accent-soft' : 'hover:bg-stone-light'}`}
                    >
                      {result.imageUrl ? (
                        <img src={result.imageUrl} alt="" loading="lazy" className="h-16 w-20 flex-none rounded-lg object-cover" />
                      ) : (
                        <span className="grid h-16 w-20 flex-none place-items-center rounded-lg bg-stone-light px-2 text-center text-[10px] font-black uppercase tracking-wide text-ink-muted">
                          {result.type}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <strong className="line-clamp-2 block text-sm leading-snug text-ink">{result.title}</strong>
                        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-bold text-accent-dark">{result.kicker}</span>
                          {date && <time dateTime={result.updatedAt || result.publishedAt}>{date}</time>}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <a href={allResultsUrl} onClick={closeAndReset} className="flex min-h-12 items-center justify-center border-t border-stone px-4 py-3 text-sm font-bold text-accent-dark hover:bg-accent-soft">
              View and filter all results
            </a>
          </>
        ) : query.trim().length >= 2 && !isSearching && !searchError ? (
          <div className="px-5 py-12 text-center">
            <p className="font-bold text-ink">No results found</p>
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
