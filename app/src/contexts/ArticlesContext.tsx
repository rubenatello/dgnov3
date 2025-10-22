import React, { createContext, useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { Article, ArticleStatus } from '../types/models';
import { Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ArticlesContextValue {
  articles: Article[];
  loading: boolean;
}

const ArticlesContext = createContext<ArticlesContextValue>({ articles: [], loading: true });

export const ArticlesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const col = collection(db, 'articles');
    const q = query(col, where('status', '==', 'published'), orderBy('publishedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const docs: Article[] = snap.docs.map((d) => {
        const data = d.data() as Partial<Article> & Record<string, unknown>;
        return {
          id: d.id,
          title: (data.title as string) || '',
          slug: (data.slug as string) || '',
          subtitle: data.subtitle as string | undefined,
          summary: data.summary as string | undefined,
          content: data.content as string | undefined,
          featuredImageId: data.featuredImageId as string | undefined,
          featuredImageUrl: data.featuredImageUrl as string | undefined,
          section: data.section as string | undefined,
          tags: (data.tags as string[]) || [],
          authorId: data.authorId as string | undefined,
          authorName: data.authorName as string | undefined,
          status: data.status as ArticleStatus | undefined,
          publishedAt: data.publishedAt as Timestamp | undefined,
          lastUpdatedAt: data.lastUpdatedAt as Timestamp | undefined,
          createdAt: data.createdAt as Timestamp | undefined,
        } as Article;
      });
      setArticles(docs);
      setLoading(false);
    }, (err) => {
      console.error('Articles onSnapshot error', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <ArticlesContext.Provider value={{ articles, loading }}>
      {children}
    </ArticlesContext.Provider>
  );
};

export default ArticlesContext;
