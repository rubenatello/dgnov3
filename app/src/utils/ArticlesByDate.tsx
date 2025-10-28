import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase'; // adjust path as needed
import ArticleCard from '../components/articles/ArticleCard'; // adjust path as needed
import type { Article } from '../types/models'; // adjust path as needed

export default function ArticlesByDate() {
  const { year, month, day } = useParams<{ year: string; month: string; day: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      // Build start and end timestamps for the day
      const start = new Date(`${year}-${month}-${day}T00:00:00`);
      const end = new Date(`${year}-${month}-${day}T23:59:59`);
      const q = query(
        collection(db, 'articles'),
        where('publishedAt', '>=', start),
        where('publishedAt', '<=', end),
        where('status', '==', 'published')
      );
      const snapshot = await getDocs(q);
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)));
      setLoading(false);
    }
    fetchArticles();
  }, [year, month, day]);

  return (
    <div>
      <h1>Articles published on {year}-{month}-{day}</h1>
      {loading ? (
        <div>Loading…</div>
      ) : articles.length === 0 ? (
        <div>No articles found for this date.</div>
      ) : (
        <div className="space-y-4">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} variant="list" />
          ))}
        </div>
      )}
    </div>
  );
}