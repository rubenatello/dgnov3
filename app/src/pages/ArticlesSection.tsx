import { SECTION_MAP } from '../components/SectionMapping';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import type { Article as ArticleModel } from '../types/models';

export default function ArticlesSection() {
	const { section } = useParams<{ section: string }>();
	const [articles, setArticles] = useState<ArticleModel[]>([]);
	const [loading, setLoading] = useState(true);
   

		useEffect(() => {
			async function fetchArticles() {
				setLoading(true);
				const firestoreSection = section ? SECTION_MAP[section] || '' : '';
				const q = query(
					collection(db, 'articles'),
					where('status', '==', 'published'),
					where('section', '==', firestoreSection)
				);
				const snap = await getDocs(q);

				const items = snap.docs.map(d => {
					const raw = d.data() as ArticleModel;
					let publishedAt: Timestamp | undefined = undefined;

					if (raw.publishedAt) {
						// normalize to Firestore Timestamp
						if (typeof raw.publishedAt === 'string') {
							const parsed = new Date(raw.publishedAt);
							if (!isNaN(parsed.getTime())) {
								publishedAt = Timestamp.fromDate(parsed);
							}
						} else if (raw.publishedAt instanceof Date) {
							publishedAt = Timestamp.fromDate(raw.publishedAt);
						} else if ('seconds' in raw.publishedAt && 'nanoseconds' in raw.publishedAt) {
							// already a Timestamp-like object
							publishedAt = raw.publishedAt as Timestamp;
						}
					}

					const article = {
						id: d.id,
						...raw,
						publishedAt,
					} as ArticleModel;

					return article;
				});

				setArticles(items);
				setLoading(false);
			}
			if (section) fetchArticles();
		}, [section]);

	return (
		<>
			<Header />
			<main className="max-w-5xl mx-auto px-4 py-8 min-h-[60vh]">
			<h1 className="font-heading font-bold text-3xl text-ink mb-6 uppercase ">{SECTION_MAP[section || ''] || section}</h1>
				{loading ? (
					<div className="text-inkMuted">Loading articles...</div>
				) : articles.length === 0 ? (
					<div className="text-inkMuted">No articles found for this section.</div>
				) : (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{articles.map(article => (
							<ArticleCard key={article.id} article={article} />
						))}
					</div>
				)}
			</main>
			<Footer />
		</>
	);
}

