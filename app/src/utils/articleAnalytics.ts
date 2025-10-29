
import { collection, getDocs, query, orderBy, limit, where, Firestore } from 'firebase/firestore';

export type ArticleAnalytics = {
	title: string;
	viewCount: number;
	likeCount: number;
	publishedAt: Date | null;
	authorName?: string;
};

// Fetch unique author names for dropdown
export async function fetchAuthors(db: Firestore): Promise<string[]> {
	const q = query(collection(db, 'articles'));
	const snapshot = await getDocs(q);
	const names = Array.from(new Set(snapshot.docs.map(doc => doc.data().authorName).filter(Boolean)));
	return names;
}

// Fetch articles with filters
export async function fetchArticlesAnalytics(
	db: Firestore,
	{
		author = 'all',
		dateFrom = '',
		dateTo = '',
		sortBy = 'viewCount', // or 'likeCount'
		max = 20,
	}: {
		author?: string;
		dateFrom?: string;
		dateTo?: string;
		sortBy?: 'viewCount' | 'likeCount';
		max?: number;
	}
): Promise<ArticleAnalytics[]> {
	const constraints: any[] = [orderBy(sortBy, 'desc'), limit(max)];
	if (author && author !== 'all') {
		constraints.push(where('authorName', '==', author));
	}
	if (dateFrom) {
		constraints.push(where('publishedAt', '>=', new Date(dateFrom)));
	}
	if (dateTo) {
		constraints.push(where('publishedAt', '<=', new Date(dateTo)));
	}
	const q = query(collection(db, 'articles'), ...constraints);
	const snapshot = await getDocs(q);
	return snapshot.docs.map(doc => ({
		title: doc.data().title,
		viewCount: doc.data().viewCount || 0,
		likeCount: doc.data().likeCount || 0,
		publishedAt: doc.data().publishedAt?.toDate() || null,
		authorName: doc.data().authorName || '',
	}));
}
