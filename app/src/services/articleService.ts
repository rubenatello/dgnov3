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

  const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), article);
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
  
  await updateDoc(docRef, {
    ...updates,
    lastUpdatedAt: serverTimestamp(),
    lastUpdatedBy: userId,
  });
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
