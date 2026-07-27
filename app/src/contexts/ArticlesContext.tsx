import React, { createContext, useEffect, useState } from 'react';
import type { Article } from '../types/models';
import { getPublishedArticleSummaries } from '../services/publicArticleService';

const PUBLIC_SHELL_ARTICLE_LIMIT = 48;

interface ArticlesContextValue {
  articles: Article[];
  loading: boolean;
  error: string | null;
}

const ArticlesContext = createContext<ArticlesContextValue>({ articles: [], loading: true, error: null });

export const ArticlesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPublishedArticleSummaries(PUBLIC_SHELL_ARTICLE_LIMIT)
      .then((items) => {
        if (!active) return;
        setArticles(items);
        setError(null);
      })
      .catch((caught) => {
        console.error('Article summaries failed to load', caught);
        if (active) setError('News could not be loaded. Please try again in a moment.');
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, []);

  return (
    <ArticlesContext.Provider value={{ articles, loading, error }}>
      {children}
    </ArticlesContext.Provider>
  );
};

export default ArticlesContext;
