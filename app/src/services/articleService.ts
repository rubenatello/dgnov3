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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Article, ArticleStatus } from '../types/models';
import { generateSlug } from '../utils/helpers';

const ARTICLES_COLLECTION = 'articles';

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
 * Get a single article by slug
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const q = query(
    collection(db, ARTICLES_COLLECTION),
    where('slug', '==', slug),
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const docSnap = querySnapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Article;
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
