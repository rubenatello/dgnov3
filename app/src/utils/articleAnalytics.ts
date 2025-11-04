
import { collection, getDocs, query, orderBy, limit, where, Firestore, Timestamp } from 'firebase/firestore';

export type ArticleAnalytics = {
  title: string;
  slug: string;
  viewCount: number;
  likeCount: number;
  publishedAt: Date | null;
  authorName?: string;
  section?: string;
  status?: string;
};

// Fetch unique author names for dropdown
export async function fetchAuthors(db: Firestore): Promise<string[]> {
  try {
    const q = query(collection(db, 'articles'));
    const snapshot = await getDocs(q);
    const names = Array.from(new Set(
      snapshot.docs
        .map(doc => doc.data().authorName)
        .filter(Boolean)
    ));
    return names.sort();
  } catch (error) {
    console.error('Error fetching authors:', error);
    return [];
  }
}

// Fetch articles with filters
export async function fetchArticlesAnalytics(
  db: Firestore,
  {
    author = 'all',
    dateFrom = '',
    dateTo = '',
    sortBy = 'viewCount',
    max = 100,
  }: {
    author?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'viewCount' | 'likeCount';
    max?: number;
  }
): Promise<ArticleAnalytics[]> {
  try {
    // Build query constraints
    const constraints = [];
    
    // Always include status filter for published articles
    constraints.push(where('status', '==', 'published'));
    
    // Add author filter if specified
    if (author && author !== 'all') {
      constraints.push(where('authorName', '==', author));
    }
    
    // Add date filters if specified
    if (dateFrom) {
      const fromDate = Timestamp.fromDate(new Date(dateFrom));
      constraints.push(where('publishedAt', '>=', fromDate));
    }
    if (dateTo) {
      const toDate = Timestamp.fromDate(new Date(dateTo + 'T23:59:59'));
      constraints.push(where('publishedAt', '<=', toDate));
    }
    
    // Add ordering and limit
    constraints.push(orderBy(sortBy, 'desc'));
    constraints.push(limit(max));
    
    const q = query(collection(db, 'articles'), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        title: data.title || 'Untitled',
        slug: data.slug || '',
        viewCount: data.viewCount || 0,
        likeCount: data.likeCount || 0,
        publishedAt: data.publishedAt?.toDate() || null,
        authorName: data.authorName || 'Unknown',
        section: data.section || '',
        status: data.status || '',
      };
    });
  } catch (error) {
    console.error('Error fetching article analytics:', error);
    return [];
  }
}

// Fetch overall site statistics
export async function fetchSiteStats(db: Firestore): Promise<{
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
  totalAuthors: number;
}> {
  try {
    const q = query(collection(db, 'articles'), where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    
    let totalViews = 0;
    let totalLikes = 0;
    const authors = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalViews += data.viewCount || 0;
      totalLikes += data.likeCount || 0;
      if (data.authorName) {
        authors.add(data.authorName);
      }
    });
    
    return {
      totalArticles: snapshot.docs.length,
      totalViews,
      totalLikes,
      totalAuthors: authors.size,
    };
  } catch (error) {
    console.error('Error fetching site stats:', error);
    return {
      totalArticles: 0,
      totalViews: 0,
      totalLikes: 0,
      totalAuthors: 0,
    };
  }
}