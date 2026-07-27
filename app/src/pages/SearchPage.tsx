import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import {
  searchPublicSite,
  type PublicSearchFilter,
  type PublicSearchResult,
} from '../services/publicSearchService';

const FILTERS: Array<{ value: PublicSearchFilter; label: string }> = [
  { value: 'all', label: 'Everything' },
  { value: 'article', label: 'Articles' },
  { value: 'tracker', label: 'Trackers' },
  { value: 'resource', label: 'Data and resources' },
];

function queryFilter(value: string | null): PublicSearchFilter {
  return FILTERS.some((filter) => filter.value === value)
    ? value as PublicSearchFilter
    : 'all';
}

function displayDate(result: PublicSearchResult): string | null {
  const value = result.updatedAt || result.publishedAt;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q')?.trim() || '';
  const filter = queryFilter(params.get('type'));
  const [draftQuery, setDraftQuery] = useState(query);
  const [results, setResults] = useState<PublicSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setDraftQuery(query), [query]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    searchPublicSite(query, filter, 30, controller.signal)
      .then((payload) => {
        setResults(payload.results);
        setTotal(payload.total);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setResults([]);
        setTotal(0);
        setError(caught instanceof Error ? caught.message : 'Search is temporarily unavailable.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filter, query]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = draftQuery.trim();
    if (nextQuery.length < 2) {
      setError('Enter at least two searchable characters.');
      return;
    }
    const next = new URLSearchParams({ q: nextQuery });
    if (filter !== 'all') next.set('type', filter);
    setParams(next);
  };

  const selectFilter = (nextFilter: PublicSearchFilter) => {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (nextFilter !== 'all') next.set('type', nextFilter);
    setParams(next);
  };

  return (
    <div className="min-h-screen bg-bg">
      <SEOHead
        title={query ? `Search results for “${query}” | DGNO` : 'Search DGNO'}
        description="Search DGNO reporting, accountability trackers, investigations, and public data resources."
        url="https://dgno.us/search"
        robots="noindex, follow"
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Reporting and public data</p>
          <h1 className="mt-3 font-heading text-4xl font-bold text-ink sm:text-5xl">Search DGNO</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Search headlines, summaries, topics, accountability trackers, investigations, and public resources.
          </p>
        </header>

        <form onSubmit={submitSearch} className="mt-8 rounded-2xl border border-stone/60 bg-surface p-4 shadow-soft sm:p-5" role="search">
          <label htmlFor="site-search" className="text-sm font-bold text-ink">Search terms</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="site-search"
              type="search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Try a person, agency, issue, or tracker"
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-stone bg-surface px-4 text-base text-ink outline-none focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/25"
              autoComplete="off"
            />
            <button type="submit" className="min-h-12 rounded-lg bg-accent-strong px-6 font-bold text-white hover:bg-accent-dark">
              Search
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap gap-2" aria-label="Filter search results">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => selectFilter(item.value)}
              aria-pressed={filter === item.value}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition ${
                filter === item.value
                  ? 'border-accent-strong bg-accent-strong text-white'
                  : 'border-stone bg-surface text-ink hover:border-accent hover:text-accent-dark'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-8" aria-live="polite">
          {loading ? (
            <div className="min-h-80 space-y-4" role="status">
              <p className="font-bold text-ink">Searching DGNO…</p>
              {[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-stone-light" />)}
            </div>
          ) : error ? (
            <div role="alert" className="min-h-80 rounded-xl border-l-4 border-red-700 bg-red-50 p-5 text-red-900">
              <p className="font-bold">Search could not be completed</p>
              <p className="mt-2">{error}</p>
            </div>
          ) : query.length < 2 ? (
            <div className="min-h-80 rounded-xl border border-stone/60 bg-surface p-6 text-ink-muted">
              Enter at least two characters to search DGNO’s public catalog.
            </div>
          ) : results.length === 0 ? (
            <div className="min-h-80 rounded-xl border border-stone/60 bg-surface p-6">
              <h2 className="text-xl font-bold text-ink">No results for “{query}”</h2>
              <p className="mt-2 text-ink-muted">Try a broader term, a related agency, or a shorter phrase.</p>
            </div>
          ) : (
            <section aria-labelledby="search-results-heading">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-accent pb-3">
                <h2 id="search-results-heading" className="text-2xl font-bold text-ink">Results for “{query}”</h2>
                <p className="text-sm text-ink-muted">Showing {results.length} of {total}</p>
              </div>
              <ol className="divide-y divide-stone/60">
                {results.map((result) => {
                  const date = displayDate(result);
                  return (
                    <li key={result.id} className="py-6">
                      <article className="flex gap-4 sm:gap-5">
                        {result.imageUrl ? (
                          <img src={result.imageUrl} alt="" loading="lazy" className="hidden h-28 w-40 flex-none rounded-xl object-cover sm:block" />
                        ) : (
                          <div className="hidden h-28 w-40 flex-none place-items-center rounded-xl bg-stone-light text-xs font-black uppercase tracking-widest text-ink-muted sm:grid">
                            {result.type}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-accent-dark">
                            <span>{result.kicker}</span>
                            {date && <time className="normal-case font-medium text-ink-muted" dateTime={result.updatedAt || result.publishedAt}>{date}</time>}
                          </div>
                          <h3 className="mt-2 font-heading text-xl font-bold leading-tight text-ink sm:text-2xl">
                            <Link to={result.url} className="hover:text-accent-dark hover:underline hover:underline-offset-4">{result.title}</Link>
                          </h3>
                          <p className="mt-2 line-clamp-3 leading-relaxed text-ink-muted">{result.description}</p>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
