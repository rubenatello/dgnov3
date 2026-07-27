import type { Article } from '../types/models';

const MAX_PUBLIC_ARTICLE_LIMIT = 100;

interface PublicArticleSummaryResponse {
  articles?: Array<Record<string, unknown>>;
}

interface ArticleSummaryFilters {
  authorId?: string;
  section?: string;
  publishedOn?: string;
}

function boundedLimit(value: number): number {
  return Math.max(1, Math.min(MAX_PUBLIC_ARTICLE_LIMIT, Math.floor(value)));
}

function articleDate(value: unknown): Article['publishedAt'] | undefined {
  const date = value instanceof Date
    ? value
    : typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : typeof value === 'string'
        ? new Date(value)
        : null;
  if (!date) return undefined;
  return Number.isNaN(date.getTime()) ? undefined : date as unknown as Article['publishedAt'];
}

function articleSummary(id: string, data: Record<string, unknown>): Article {
  return {
    id,
    title: typeof data.title === 'string' ? data.title : '',
    slug: typeof data.slug === 'string' ? data.slug : '',
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : undefined,
    summary: typeof data.summary === 'string' ? data.summary : undefined,
    featuredImageId: typeof data.featuredImageId === 'string' ? data.featuredImageId : undefined,
    featuredImageUrl: typeof data.featuredImageUrl === 'string' ? data.featuredImageUrl : undefined,
    featuredImageDescription: typeof data.featuredImageDescription === 'string' ? data.featuredImageDescription : undefined,
    section: typeof data.section === 'string' ? data.section : undefined,
    tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    authorId: typeof data.authorId === 'string' ? data.authorId : undefined,
    authorName: typeof data.authorName === 'string' ? data.authorName : undefined,
    publishedAt: articleDate(data.publishedAt),
    lastUpdatedAt: articleDate(data.lastUpdatedAt),
    breakingUntil: articleDate(data.breakingUntil),
    viewCount: typeof data.viewCount === 'number' ? data.viewCount : undefined,
    likeCount: typeof data.likeCount === 'number' ? data.likeCount : undefined,
    commentCount: typeof data.commentCount === 'number' ? data.commentCount : undefined,
    wordCount: typeof data.wordCount === 'number' ? data.wordCount : undefined,
    status: 'published',
  };
}

async function fetchSummaries(params: URLSearchParams): Promise<Article[]> {
  const response = await fetch(`/api/articles?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error(`Article summary API returned ${response.status}.`);
  const payload = await response.json() as PublicArticleSummaryResponse;
  if (!Array.isArray(payload.articles)) throw new Error('Article summary API returned an invalid response.');
  return payload.articles
    .map((data) => articleSummary(String(data.id || ''), data))
    .filter((article) => Boolean(article.id && article.title && article.slug));
}

function publicationDay(value: unknown): string | null {
  const date = value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
    ? value.toDate()
    : value instanceof Date
      ? value
      : null;
  if (!date) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

async function developmentFirestoreFallback(
  limitCount: number,
  filters: ArticleSummaryFilters = {},
): Promise<Article[]> {
  const [{ db }, firestore] = await Promise.all([
    import('../config/firebase'),
    import('firebase/firestore'),
  ]);
  const constraints = [
    firestore.where('status', '==', 'published'),
    firestore.orderBy('publishedAt', 'desc'),
    firestore.limit(MAX_PUBLIC_ARTICLE_LIMIT),
  ];
  const snapshot = await firestore.getDocs(firestore.query(firestore.collection(db, 'articles'), ...constraints));
  return snapshot.docs
    .map((document) => articleSummary(document.id, document.data()))
    .filter((article) => !filters.authorId || article.authorId === filters.authorId)
    .filter((article) => !filters.section || article.section === filters.section)
    .filter((article) => !filters.publishedOn || publicationDay(article.publishedAt) === filters.publishedOn)
    .slice(0, limitCount);
}

async function withDevelopmentFallback(
  params: URLSearchParams,
  limitCount: number,
  filters: ArticleSummaryFilters = {},
): Promise<Article[]> {
  try {
    return await fetchSummaries(params);
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    console.warn('Article summary API unavailable in development; using a bounded Firestore fallback.', error);
    return developmentFirestoreFallback(limitCount, filters);
  }
}

function summaryParams(limitCount: number, filters: ArticleSummaryFilters = {}): URLSearchParams {
  const params = new URLSearchParams({ limit: String(limitCount) });
  if (filters.authorId) params.set('authorId', filters.authorId);
  if (filters.section) params.set('section', filters.section);
  if (filters.publishedOn) params.set('publishedOn', filters.publishedOn);
  return params;
}

export function getPublishedArticleSummaries(maxResults = 48): Promise<Article[]> {
  const limitCount = boundedLimit(maxResults);
  return withDevelopmentFallback(summaryParams(limitCount), limitCount);
}

export function getPublishedArticleSummariesByAuthor(authorId: string, maxResults = 24): Promise<Article[]> {
  const limitCount = boundedLimit(maxResults);
  const filters = { authorId };
  return withDevelopmentFallback(summaryParams(limitCount, filters), limitCount, filters);
}

export function getPublishedArticleSummariesBySection(section: string, maxResults = 48): Promise<Article[]> {
  const limitCount = boundedLimit(maxResults);
  const filters = { section };
  return withDevelopmentFallback(summaryParams(limitCount, filters), limitCount, filters);
}

export function getPublishedArticleSummariesByDate(publishedOn: string, maxResults = 100): Promise<Article[]> {
  const limitCount = boundedLimit(maxResults);
  const filters = { publishedOn };
  return withDevelopmentFallback(summaryParams(limitCount, filters), limitCount, filters);
}
