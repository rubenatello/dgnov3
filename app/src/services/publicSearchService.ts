export type PublicSearchResultType = 'article' | 'tracker' | 'resource';
export type PublicSearchFilter = PublicSearchResultType | 'all';

export interface PublicSearchResult {
  id: string;
  type: PublicSearchResultType;
  title: string;
  description: string;
  url: string;
  kicker: string;
  imageUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
}

interface PublicSearchResponse {
  query?: string;
  type?: PublicSearchFilter;
  results?: PublicSearchResult[];
  total?: number;
}

export interface PublicSearchPayload {
  query: string;
  type: PublicSearchFilter;
  results: PublicSearchResult[];
  total: number;
}

export async function searchPublicSite(
  query: string,
  type: PublicSearchFilter = 'all',
  limit = 12,
  signal?: AbortSignal,
): Promise<PublicSearchPayload> {
  const params = new URLSearchParams({
    q: query.trim(),
    type,
    limit: String(limit),
  });
  const response = await fetch(`/api/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  });
  if (!response.ok) {
    throw new Error(response.status === 400
      ? 'Enter at least two searchable characters.'
      : 'Search is temporarily unavailable.');
  }

  const payload = await response.json() as PublicSearchResponse;
  if (!Array.isArray(payload.results)) {
    throw new Error('Search returned an invalid response.');
  }
  return {
    query: typeof payload.query === 'string' ? payload.query : query.trim(),
    type: payload.type || type,
    results: payload.results.filter((result) =>
      result && typeof result.id === 'string' &&
      typeof result.title === 'string' &&
      typeof result.url === 'string'),
    total: typeof payload.total === 'number' ? payload.total : payload.results.length,
  };
}
