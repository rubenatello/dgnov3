import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Article, ArticleStatus } from '../types/models';
import { generateSlug } from '../utils/helpers';
import { normalizeArticleSlug } from '../utils/seoConstants';
import { getPublishedArticleSummaries, getPublishedArticleSummariesByAuthor } from './publicArticleService';

const ARTICLES_COLLECTION = 'articles';
const DEFAULT_PUBLIC_ARTICLE_LIMIT = 48;

/**
 * Keep public lists and search results intentionally lightweight in memory.
 * Firestore's browser SDK does not support field projections, so the query is
 * also bounded; full article bodies are retained only by single-article reads.
 */
export function toArticleSummary(id: string, data: Partial<Article>): Article {
  return {
    id,
    title: data.title || '',
    slug: data.slug || '',
    subtitle: data.subtitle,
    summary: data.summary,
    featuredImageId: data.featuredImageId,
    featuredImageUrl: data.featuredImageUrl,
    featuredImageDescription: data.featuredImageDescription,
    featuredImageSourceCredit: data.featuredImageSourceCredit,
    section: data.section,
    tags: data.tags || [],
    authorId: data.authorId,
    coAuthorId: data.coAuthorId,
    authorName: data.authorName,
    coAuthorName: data.coAuthorName,
    status: data.status,
    publishedAt: data.publishedAt,
    breakingUntil: data.breakingUntil,
    viewCount: data.viewCount,
    likeCount: data.likeCount,
    commentCount: data.commentCount,
    wordCount: data.wordCount,
    lastUpdatedAt: data.lastUpdatedAt,
  };
}

// Type for autosave documents
export interface ArticleAutosave {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  summary?: string;
  tags?: string[];
  section?: string;
  featuredImageUrl?: string;
  authorId: string;
  createdAt: Date | object; // Allow Firestore serverTimestamp
  timestamp: Date | object; // Allow Firestore serverTimestamp
}

// Remove undefined values from an object before sending to Firestore
// internal: sanitize object before sending to Firestore. We allow `any` here because
// Firestore documents can contain mixed values (timestamps, strings, arrays).
/* eslint-disable @typescript-eslint/no-explicit-any */
function sanitizeForFirestore<T extends Record<string, any>>(obj: Partial<T>): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(obj)) {
    const v = (obj as unknown as Record<string, any>)[key];
    if (v !== undefined) {
      out[key as keyof T] = v as T[keyof T];
    }
  }
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Create a new article
 */
export async function createArticle(
  articleData: Omit<Article, 'id' | 'createdAt' | 'lastUpdatedAt' | 'slug'>
): Promise<string> {
  const slug = generateSlug(articleData.title);
  
  const article = {
    ...articleData,
    slug,
    createdAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp(),
  };

  const clean = sanitizeForFirestore<Article>(article as Partial<Article>);
  const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), clean as Partial<Article>);
  return docRef.id;
}

/** Check all article states for an existing generated slug before importing. */
export async function articleSlugExists(slug: string): Promise<boolean> {
  const originalSlug = slug.replace(/^\/+|\/+$/g, '');
  const normalizedSlug = originalSlug.split('/').filter(Boolean).pop() || originalSlug;
  const candidates = [originalSlug, normalizedSlug].filter((candidate, index, all) => candidate && all.indexOf(candidate) === index);
  for (const candidate of candidates) {
    const q = query(collection(db, ARTICLES_COLLECTION), where('slug', '==', candidate), firestoreLimit(1));
    if (!(await getDocs(q)).empty) return true;
  }
  return false;
}

/**
 * Update an existing article
 */
export async function updateArticle(
  articleId: string,
  updates: Partial<Article>,
  userId: string
): Promise<void> {
  const docRef = doc(db, ARTICLES_COLLECTION, articleId);
  const payload = sanitizeForFirestore<Article>({
    ...(updates as Partial<Article>),
    lastUpdatedAt: serverTimestamp() as unknown as Article['lastUpdatedAt'],
    lastUpdatedBy: userId as unknown as Article['lastUpdatedBy'],
  });

  await updateDoc(docRef, payload as Partial<Record<string, unknown>>);
}

/**
 * Get a single article by ID
 */
export async function getArticle(articleId: string): Promise<Article | null> {
  const docRef = doc(db, ARTICLES_COLLECTION, articleId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Article;
  }
  return null;
}

/**
 * Get published articles
 */
export async function getPublishedArticles(maxResults = DEFAULT_PUBLIC_ARTICLE_LIMIT): Promise<Article[]> {
  return getPublishedArticleSummaries(maxResults);
}

/**
 * Get current breaking articles (published, and breakingUntil in the future)
 */
export async function getBreakingArticles(): Promise<Article[]> {
  const now = new Date();
  const q = query(
    collection(db, ARTICLES_COLLECTION),
    where('status', '==', 'published'),
    where('breakingUntil', '>', now),
    orderBy('breakingUntil', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
}

/**
 * Get a single article by slug
 */
export async function getArticleBySlug(slug: string, legacyDatePath?: string): Promise<Article | null> {
  const titleSlug = slug.split('/').filter(Boolean).pop();
  if (!titleSlug) return null;

  // New records store only the title segment. The second candidate preserves
  // published legacy records that stored YYYY/MM/DD/title in the slug field.
  const candidates = [
    titleSlug,
    legacyDatePath ? `${legacyDatePath.replace(/^\/+|\/+$/g, '')}/${titleSlug}` : null,
  ].filter((candidate, index, all): candidate is string => Boolean(candidate) && all.indexOf(candidate) === index);

  for (const candidate of candidates) {
    const q = query(
      collection(db, ARTICLES_COLLECTION),
      where('slug', '==', candidate),
      where('status', '==', 'published'),
      firestoreLimit(1),
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Article;
    }
  }

  // Some legacy records embedded a draft/creation date in `slug` that differs
  // from the truthful publishedAt date now used by the canonical route. If the
  // two exact candidates miss, inspect only a bounded publication-date window
  // on this single-article route and compare the normalized title segment.
  if (legacyDatePath && /^\d{4}\/\d{2}\/\d{2}$/.test(legacyDatePath)) {
    const routeDate = new Date(`${legacyDatePath.replaceAll('/', '-')}T00:00:00.000Z`);
    if (!Number.isNaN(routeDate.getTime())) {
      const start = new Date(routeDate.getTime() - 24 * 60 * 60 * 1000);
      const end = new Date(routeDate.getTime() + 48 * 60 * 60 * 1000);
      const dateQuery = query(
        collection(db, ARTICLES_COLLECTION),
        where('status', '==', 'published'),
        where('publishedAt', '>=', start),
        where('publishedAt', '<', end),
        orderBy('publishedAt', 'desc'),
        firestoreLimit(100),
      );
      const dateSnapshot = await getDocs(dateQuery);
      const legacyMatch = dateSnapshot.docs.find((document) =>
        normalizeArticleSlug(String(document.data().slug || '')) === titleSlug,
      );
      if (legacyMatch) return { id: legacyMatch.id, ...legacyMatch.data() } as Article;
    }
  }

  return null;
}

/**
 * Get related articles by tags (excluding current article)
 */
export async function getRelatedArticles(tags: string[], excludeId: string, limit: number = 5): Promise<Article[]> {
  if (!tags || tags.length === 0) return [];
  
  // Firestore 'array-contains-any' can check up to 10 values
  const searchTags = tags.slice(0, 10);
  
  const q = query(
    collection(db, ARTICLES_COLLECTION),
    where('status', '==', 'published'),
    where('tags', 'array-contains-any', searchTags),
    orderBy('publishedAt', 'desc'),
    firestoreLimit(limit + 1) // Get one extra in case we need to exclude current
  );
  
  const querySnapshot = await getDocs(q);
  const articles = querySnapshot.docs
    .map(doc => toArticleSummary(doc.id, doc.data() as Partial<Article>))
    .filter(article => article.id !== excludeId)
    .slice(0, limit);
  
  return articles;
}

/**
 * Get articles by author
 */
export async function getArticlesByAuthor(authorId: string): Promise<Article[]> {
  return getPublishedArticleSummariesByAuthor(authorId, 24);
}

/**
 * Get articles by status
 */
export async function getArticlesByStatus(status: ArticleStatus): Promise<Article[]> {
  const q = query(
    collection(db, ARTICLES_COLLECTION),
    where('status', '==', status),
    orderBy('lastUpdatedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Article));
}

/**
 * Create a lightweight draft article. Allows creating a draft without a title/slug.
 * Returns the new draft ID.
 */
export async function createDraft(
  draftData: Partial<Article>
): Promise<string> {
  const article = {
    ...draftData,
    status: draftData.status || 'draft',
    createdAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp(),
  } as Partial<Article>;

  const clean = sanitizeForFirestore<Article>(article);
  const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), clean as Partial<Article>);
  return docRef.id;
}

/**
 * Publish an article in a transaction.
 * - Ensures publishedAt is set only once (if not already present)
 * - Atomically updates status and other fields
 */
export async function publishArticle(
  articleId: string,
  updates: Partial<Article>,
  userId: string
): Promise<void> {
  // Import runTransaction lazily to avoid circular issues in some bundlers
  const { runTransaction } = await import('firebase/firestore');
  const ref = doc(db, ARTICLES_COLLECTION, articleId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Article not found');
    const data = snap.data();

    // Prepare payload: keep sanitation consistent with updateArticle
    const payload = sanitizeForFirestore<Article>({
      ...(updates as Partial<Article>),
      status: 'published',
      lastUpdatedAt: serverTimestamp() as unknown as Article['lastUpdatedAt'],
      lastUpdatedBy: userId as unknown as Article['lastUpdatedBy'],
    });

    // If publishedAt wasn't set before, set it now
    if (!data.publishedAt) {
      (payload as Partial<Record<string, unknown>>).publishedAt = serverTimestamp();
    }

    tx.update(ref, payload as Partial<Record<string, unknown>>);
  });
}

/**
 * Create an autosave in the autosaves subcollection under an article
 */
export async function createAutosave(
  articleId: string,
  autosaveData: Omit<ArticleAutosave, 'id' | 'createdAt' | 'timestamp'>
): Promise<string> {
  const autosave = {
    ...autosaveData,
    createdAt: serverTimestamp(),
    timestamp: serverTimestamp(),
  };

  const clean = sanitizeForFirestore(autosave);
  const autosavesCollection = collection(db, ARTICLES_COLLECTION, articleId, 'autosaves');
  const docRef = await addDoc(autosavesCollection, clean as Partial<ArticleAutosave>);
  return docRef.id;
}

/**
 * Get all autosaves for an article, ordered by timestamp (newest first)
 */
export async function getAutosaves(articleId: string): Promise<ArticleAutosave[]> {
  const autosavesCollection = collection(db, ARTICLES_COLLECTION, articleId, 'autosaves');
  const q = query(autosavesCollection, orderBy('timestamp', 'desc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ArticleAutosave));
}

/**
 * Get the latest autosave for an article
 */
export async function getLatestAutosave(articleId: string): Promise<ArticleAutosave | null> {
  const autosavesCollection = collection(db, ARTICLES_COLLECTION, articleId, 'autosaves');
  const q = query(autosavesCollection, orderBy('timestamp', 'desc'), firestoreLimit(1));
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as ArticleAutosave;
}

/**
 * Get a specific autosave by ID
 */
export async function getAutosave(articleId: string, autosaveId: string): Promise<ArticleAutosave | null> {
  const docRef = doc(db, ARTICLES_COLLECTION, articleId, 'autosaves', autosaveId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ArticleAutosave;
  }
  return null;
}

/**
 * Delete an autosave
 */
export async function deleteAutosave(articleId: string, autosaveId: string): Promise<void> {
  const { deleteDoc } = await import('firebase/firestore');
  const docRef = doc(db, ARTICLES_COLLECTION, articleId, 'autosaves', autosaveId);
  await deleteDoc(docRef);
}

/**
 * Restore an autosave to the main article document
 */
export async function restoreAutosave(
  articleId: string, 
  autosaveId: string, 
  userId: string
): Promise<void> {
  const autosave = await getAutosave(articleId, autosaveId);
  if (!autosave) throw new Error('Autosave not found');

  const updates: Partial<Article> = {
    title: autosave.title,
    subtitle: autosave.subtitle,
    content: autosave.content,
    summary: autosave.summary,
    tags: autosave.tags,
    section: autosave.section,
    featuredImageUrl: autosave.featuredImageUrl,
  };

  await updateArticle(articleId, updates, userId);
}

/**
 * Publish an article from an autosave
 */
export async function publishFromAutosave(
  articleId: string,
  autosaveId: string,
  userId: string
): Promise<void> {
  const autosave = await getAutosave(articleId, autosaveId);
  if (!autosave) throw new Error('Autosave not found');

  const updates: Partial<Article> = {
    title: autosave.title,
    subtitle: autosave.subtitle,
    content: autosave.content,
    summary: autosave.summary,
    tags: autosave.tags,
    section: autosave.section,
    featuredImageUrl: autosave.featuredImageUrl,
  };

  await publishArticle(articleId, updates, userId);
}
