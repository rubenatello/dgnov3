import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { query, collection, where, getDocs, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Article } from '../../types/models';
import ArticleCard from './ArticleCard';
import LoadingScreen from '../LoadingScreen';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 10;

export default function ArticlesByDate() {
  const { year, month, day } = useParams<{ year: string; month: string; day: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setArticles([]);
    setLastDoc(null);
    setHasMore(true);
    fetchArticles();
    // eslint-disable-next-line
  }, [year, month, day]);

 function getAdjacentDate(offset: number) {
  const current = new Date(Number(year), Number(month) - 1, Number(day)); // Use numbers for Date constructor
  current.setDate(current.getDate() + offset);
  const yyyy = current.getFullYear();
  const mm = String(current.getMonth() + 1).padStart(2, '0');
  const dd = String(current.getDate()).padStart(2, '0');
  return `/article/${yyyy}/${mm}/${dd}`;
}

  async function fetchArticles(loadMore = false) {
    setLoading(true);
    const start = Timestamp.fromDate(new Date(`${year}-${month}-${day}T00:00:00`));
    const end = Timestamp.fromDate(new Date(`${year}-${month}-${day}T23:59:59`));
    let q = query(
      collection(db, 'articles'),
      where('publishedAt', '>=', start),
      where('publishedAt', '<=', end),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'asc'),
      limit(PAGE_SIZE)
    );
    if (loadMore && lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    const snapshot = await getDocs(q);
    const newArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
    setArticles(prev => loadMore ? [...prev, ...newArticles] : newArticles);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === PAGE_SIZE);
    setLoading(false);
  }

  return (

    <div className="max-w-4xl mx-auto px-4 py-8">
       <h1 className="text-center font-heading font-bold text-2xl md:text-4xl mb-8 py-4 bg-gradient-to-r from-accent/10 via-white to-accent/10 rounded shadow italic">
        Articles published on <span className="text-accent">{year}-{month}-{day}</span>
      </h1>
      {/* Navigation Buttons */}
      <div className="flex justify-between mb-6">
        <button
          className="px-4 py-1 bg-accent text-white rounded shadow hover:bg-accent-dark transition"
          onClick={() => navigate(getAdjacentDate(-1))}
        >
          ← Previous Day
        </button>
        <button
          className="px-4 py-1 bg-accent text-white rounded shadow hover:bg-accent-dark transition"
          onClick={() => navigate(getAdjacentDate(1))}
        >
          Next Day →
        </button>
      </div>
     
      {loading && articles.length === 0 ? (
        <LoadingScreen message="Loading articles…" />
      ) : articles.length === 0 ? (
        <div className="text-center text-gray-500">No articles found for this date.</div>
      ) : (
        <div className="space-y-6">
          {articles.map(article => (
            <div key={article.id} className="bg-white rounded shadow p-4 hover:shadow-lg transition">
              <ArticleCard article={article} variant="secondary" />
            </div>
          ))} 
          {hasMore && (
            <div className="text-center mt-6">
              <button
                className="px-4 py-2 bg-accent text-white rounded shadow hover:bg-accent-dark transition"
                onClick={() => fetchArticles(true)}
                disabled={loading}
              >
                {loading ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}