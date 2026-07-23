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
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Article, ArticleStatus } from '../types/models';
import { generateSlug } from '../utils/helpers';

const ARTICLES_COLLECTION = 'articles';

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
  const q = query(collection(db, ARTICLES_COLLECTION), where('slug', '==', slug), firestoreLimit(1));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
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
export async function getPublishedArticles(): Promise<Article[]> {
  const q = query(
    collection(db, ARTICLES_COLLECTION),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Article));
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
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const q = query(
    collection(db, ARTICLES_COLLECTION),
    // Add status filter so Firestore rules can evaluate query for anonymous users
    // Public readers are allowed to fetch only published articles
    where('slug', '==', slug),
    where('status', '==', 'published'),
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const docSnap = querySnapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Article;
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
    .map(doc => ({ id: doc.id, ...doc.data() } as Article))
    .filter(article => article.id !== excludeId)
    .slice(0, limit);
  
  return articles;
}

/**
 * Get articles by author
 */
export async function getArticlesByAuthor(authorId: string): Promise<Article[]> {
  const q = query(
    collection(db, ARTICLES_COLLECTION),
    where('authorId', '==', authorId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Article));
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
