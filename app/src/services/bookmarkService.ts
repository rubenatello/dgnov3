import { 
  doc, 
  getDoc,
  setDoc, 
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Bookmark, Article } from '../types/models';

/**
 * Check if an article is bookmarked by a user
 */
export async function isArticleBookmarked(
  userId: string,
  articleId: string
): Promise<boolean> {
  const bookmarkRef = doc(db, 'bookmarks', userId, 'articles', articleId);
  const bookmarkDoc = await getDoc(bookmarkRef);
  return bookmarkDoc.exists();
}

/**
 * Toggle bookmark for an article
 * Returns true if bookmarked, false if unbookmarked
 */
export async function toggleBookmark(
  userId: string,
  articleId: string
): Promise<boolean> {
  const bookmarkRef = doc(db, 'bookmarks', userId, 'articles', articleId);
  const bookmarkDoc = await getDoc(bookmarkRef);
  
  if (bookmarkDoc.exists()) {
    // Remove bookmark
    await deleteDoc(bookmarkRef);
    return false;
  } else {
    // Add bookmark
    const bookmarkData: Omit<Bookmark, 'id'> = {
      userId,
      articleId,
      createdAt: Timestamp.now()
    };
    await setDoc(bookmarkRef, bookmarkData);
    return true;
  }
}

/**
 * Add a bookmark
 */
export async function addBookmark(
  userId: string,
  articleId: string
): Promise<void> {
  const bookmarkRef = doc(db, 'bookmarks', userId, 'articles', articleId);
  const bookmarkData: Omit<Bookmark, 'id'> = {
    userId,
    articleId,
    createdAt: Timestamp.now()
  };
  await setDoc(bookmarkRef, bookmarkData);
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(
  userId: string,
  articleId: string
): Promise<void> {
  const bookmarkRef = doc(db, 'bookmarks', userId, 'articles', articleId);
  await deleteDoc(bookmarkRef);
}

/**
 * Get all bookmarks for a user
 */
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  const bookmarksRef = collection(db, 'bookmarks', userId, 'articles');
  const q = query(bookmarksRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Bookmark));
}

/**
 * Get bookmarked articles with full article data
 */
export async function getBookmarkedArticles(userId: string): Promise<Article[]> {
  const bookmarks = await getUserBookmarks(userId);
  
  // Fetch article details for each bookmark
  const articles: Article[] = [];
  
  for (const bookmark of bookmarks) {
    const articleRef = doc(db, 'articles', bookmark.articleId);
    const articleDoc = await getDoc(articleRef);
    
    if (articleDoc.exists()) {
      articles.push({
        id: articleDoc.id,
        ...articleDoc.data()
      } as Article);
    }
  }
  
  return articles;
}

/**
 * Get bookmark count for a user
 */
export async function getBookmarkCount(userId: string): Promise<number> {
  const bookmarksRef = collection(db, 'bookmarks', userId, 'articles');
  const snapshot = await getDocs(bookmarksRef);
  return snapshot.size;
}
