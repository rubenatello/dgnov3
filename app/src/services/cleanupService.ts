import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Clean up orphaned single-character draft articles that were created during development
 * This removes drafts with very short titles (1-2 characters) that are likely test artifacts
 */
export async function cleanupOrphanedDrafts(userId: string): Promise<number> {
  try {
    const articlesRef = collection(db, 'articles');
    const q = query(
      articlesRef,
      where('status', '==', 'draft'),
      where('authorId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    let deletedCount = 0;
    
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const title = data.title || '';
      
      // Delete drafts with very short titles (likely orphaned test drafts)
      if (title.length <= 2 && title.match(/^[a-zA-Z]{1,2}$/)) {
        await deleteDoc(doc(db, 'articles', docSnap.id));
        deletedCount++;
        console.log(`Deleted orphaned draft: "${title}" (${docSnap.id})`);
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up orphaned drafts:', error);
    return 0;
  }
}

/**
 * Clean up all draft articles for a user (use with caution!)
 */
export async function cleanupAllDrafts(userId: string): Promise<number> {
  try {
    const articlesRef = collection(db, 'articles');
    const q = query(
      articlesRef,
      where('status', '==', 'draft'),
      where('authorId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    let deletedCount = 0;
    
    for (const docSnap of querySnapshot.docs) {
      await deleteDoc(doc(db, 'articles', docSnap.id));
      deletedCount++;
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up all drafts:', error);
    return 0;
  }
}