
import { useEffect, useState } from 'react';
import { getPublishedArticles } from '../../services/articleService';
import type { Article } from '../../types/models';
import LoadingScreen from '../LoadingScreen';
import ArticleCard from '../articles/ArticleCard';
import ArticleAccordion from '../articles/ArticleAccordion';
import {
  getTodaysArticles,
  getTrendingArticles,
  getTrumpPresidencyArticles,
  getFeaturedArticle,
  getTopStories,
  getLatestArticles,
  getSidebarArticles,
} from '../../utils/helpers';

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const published = await getPublishedArticles();
        setArticles(published);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  // Article selection with better logic
  const featured = getFeaturedArticle(articles);
  const topStories = getTopStories(articles, featured, 4);
  const todaysArticles = getTodaysArticles(articles);
  const trumpArticles = getTrumpPresidencyArticles(articles);
  const trendingArticles = getTrendingArticles(articles, 6);
  
  // Get latest articles excluding featured and top stories
  const excludeIds = [featured?.id, ...topStories.map(a => a.id)].filter(Boolean) as string[];
  const latestArticles = getLatestArticles(articles, excludeIds, 8);
  const sidebarArticles = getSidebarArticles(articles, excludeIds, 6);

  return (
    <div className="min-h-screen bg-white">
      {/* Loading and Error States */}
      {loading && <LoadingScreen message="Loading articles…" />}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading articles</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!loading && !error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured Article */}
          {featured && (
            <section className="mb-8 sm:mb-12">
              <ArticleCard article={featured} variant="featured" />
            </section>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Main Content Area */}
            <main className="lg:col-span-3">
              {/* Top Stories */}
              {topStories.length > 0 && (
                <section className="mb-8 sm:mb-12">
                  <div className="border-b-2 border-accent pb-2 mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-ink uppercase tracking-wide">
                      Top Stories
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    {topStories.map((article) => (
                      <ArticleCard key={article.id} article={article} variant="secondary" />
                    ))}
                  </div>
                </section>
              )}

              {/* Today's News */}
              {todaysArticles.length > 0 && (
                <ArticleAccordion 
                  articles={todaysArticles} 
                  title="Today's News" 
                  maxVisible={4}
                  variant="list"
                />
              )}

              {/* Trump Presidency */}
              {trumpArticles.length > 0 && (
                <ArticleAccordion 
                  articles={trumpArticles} 
                  title="Trump Presidency" 
                  maxVisible={4}
                  variant="list"
                />
              )}

              {/* Latest News */}
              {latestArticles.length > 0 && (
                <ArticleAccordion 
                  articles={latestArticles} 
                  title="Latest News" 
                  maxVisible={6}
                  variant="list"
                />
              )}
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-8 space-y-8">
                {/* Trending */}
                {trendingArticles.length > 0 && (
                  <section>
                    <div className="border-b-2 border-accent pb-2 mb-4">
                      <h2 className="text-lg font-bold text-ink uppercase tracking-wide">
                        Trending
                      </h2>
                    </div>
                    <div className="space-y-0">
                      {trendingArticles.map((article) => (
                        <ArticleCard key={article.id} article={article} variant="compact" />
                      ))}
                    </div>
                  </section>
                )}

                {/* Most Read */}
                {sidebarArticles.length > 0 && (
                  <section>
                    <div className="border-b-2 border-accent pb-2 mb-4">
                      <h2 className="text-lg font-bold text-ink uppercase tracking-wide">
                        Most Read
                      </h2>
                    </div>
                    <div className="space-y-0">
                      {sidebarArticles.map((article) => (
                        <ArticleCard key={article.id} article={article} variant="compact" />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
