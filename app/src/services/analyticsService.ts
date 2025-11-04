import { db } from '../config/firebase';
import { doc, updateDoc, increment, serverTimestamp, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';



// Track article view
export async function trackArticleView(articleId: string, userId?: string) {
  try {
    // Increment the view count on the article
    const articleRef = doc(db, 'articles', articleId);
    await updateDoc(articleRef, {
      viewCount: increment(1),
      lastViewedAt: serverTimestamp()
    });

    // Track individual view record for detailed analytics (optional)
    if (userId) {
      const viewId = `${articleId}_${userId}_${Date.now()}`;
      await setDoc(doc(db, 'articleViews', viewId), {
        articleId,
        userId,
        viewedAt: serverTimestamp(),
        timestamp: new Date()
      });
    }

    console.log('Article view tracked successfully');
  } catch (error) {
    console.error('Error tracking article view:', error);
  }
}

// Track article like
export async function trackArticleLike(articleId: string, userId: string) {
  try {
    const reactionId = `${articleId}_${userId}`;
    const reactionRef = doc(db, 'reactions', reactionId);
    
    // Check if user already liked this article
    const existingReaction = await getDoc(reactionRef);
    
    if (existingReaction.exists()) {
      // Unlike: remove reaction and decrement count
      await deleteDoc(reactionRef);
      await updateDoc(doc(db, 'articles', articleId), {
        likeCount: increment(-1)
      });
      return false; // unliked
    } else {
      // Like: add reaction and increment count
      await setDoc(reactionRef, {
        articleId,
        userId,
        kind: 'like',
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'articles', articleId), {
        likeCount: increment(1)
      });
      return true; // liked
    }
  } catch (error) {
    console.error('Error tracking article like:', error);
    throw error;
  }
}

// Check if user has liked an article
export async function hasUserLikedArticle(articleId: string, userId: string): Promise<boolean> {
  try {
    const reactionId = `${articleId}_${userId}`;
    const reactionDoc = await getDoc(doc(db, 'reactions', reactionId));
    return reactionDoc.exists();
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
}

// Initialize analytics data for existing articles (migration function)
export async function initializeAnalyticsForExistingArticles() {
  try {
    console.log('Starting analytics initialization for existing articles...');
    
    const articlesQuery = query(collection(db, 'articles'));
    const snapshot = await getDocs(articlesQuery);
    
    let updated = 0;
    const batch = [];
    
    for (const articleDoc of snapshot.docs) {
      const data = articleDoc.data();
      
      // Only update if viewCount or likeCount are missing
      if (data.viewCount === undefined || data.likeCount === undefined) {
        batch.push(
          updateDoc(articleDoc.ref, {
            viewCount: data.viewCount || 0,
            likeCount: data.likeCount || 0,
            commentCount: data.commentCount || 0,
            lastViewedAt: data.lastViewedAt || null
          })
        );
        updated++;
      }
    }
    
    // Execute all updates
    await Promise.all(batch);
    
    console.log(`Analytics initialization complete. Updated ${updated} articles.`);
    return { success: true, articlesUpdated: updated };
  } catch (error) {
    console.error('Error initializing analytics:', error);
    return { success: false, error: String(error) };
  }
}

// Get popular articles (most viewed in last N days)
export async function getPopularArticles(days: number = 7, limit: number = 10) {
  try {
    const articlesQuery = query(
      collection(db, 'articles'),
      where('status', '==', 'published')
    );
    
    const snapshot = await getDocs(articlesQuery);
    const articles = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(article => {
        // Filter by date range if lastViewedAt exists
        const articleData = article as Record<string, unknown>;
        if (articleData.lastViewedAt) {
          const lastViewed = (articleData.lastViewedAt as { toDate: () => Date }).toDate();
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          return lastViewed >= cutoff;
        }
        return true; // Include articles without lastViewedAt
      })
      .sort((a, b) => {
        const aData = a as Record<string, unknown>;
        const bData = b as Record<string, unknown>;
        return (Number(bData.viewCount) || 0) - (Number(aData.viewCount) || 0);
      })
      .slice(0, limit);
    
    return articles;
  } catch (error) {
    console.error('Error getting popular articles:', error);
    return [];
  }
}

// Add some demo data for testing (remove in production)
export async function addDemoAnalyticsData() {
  try {
    console.log('Adding demo analytics data...');
    
    const articlesQuery = query(collection(db, 'articles'), where('status', '==', 'published'));
    const snapshot = await getDocs(articlesQuery);
    
    let updated = 0;
    
    for (const articleDoc of snapshot.docs) {
      const randomViews = Math.floor(Math.random() * 1000) + 50; // 50-1050 views
      const randomLikes = Math.floor(Math.random() * (randomViews * 0.1)) + 1; // 1-10% like rate
      
      await updateDoc(articleDoc.ref, {
        viewCount: randomViews,
        likeCount: randomLikes,
        commentCount: Math.floor(Math.random() * 20),
        lastViewedAt: serverTimestamp()
      });
      
      updated++;
    }
    
    console.log(`Demo data added to ${updated} articles`);
    return { success: true, articlesUpdated: updated };
  } catch (error) {
    console.error('Error adding demo data:', error);
    return { success: false, error: String(error) };
  }
}