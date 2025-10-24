import { useState } from 'react';
import type { Article } from '../../types/models';
import ArticleCard from './ArticleCard';

interface ArticleAccordionProps {
  articles: Article[];
  title: string;
  maxVisible?: number;
  variant?: 'list' | 'compact';
}

export default function ArticleAccordion({ 
  articles, 
  title, 
  maxVisible = 3, 
  variant = 'list' 
}: ArticleAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleArticles = expanded ? articles : articles.slice(0, maxVisible);
  const hasMore = articles.length > maxVisible;

  if (!articles.length) return null;

  return (
    <section className="mb-6 sm:mb-8">
      <div className="border-b-2 border-accent pb-2 mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-ink uppercase tracking-wide">
          {title}
        </h2>
      </div>
      
      <div className="space-y-0">
        {visibleArticles.map((article, index) => (
          <ArticleCard 
            key={article.id} 
            article={article} 
            variant={variant}
          />
        ))}
      </div>
      
      {hasMore && (
        <button
          className="mt-4 px-4 py-2 text-sm font-semibold text-accent border border-accent hover:bg-accent hover:text-white transition-colors duration-200 w-full sm:w-auto"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show Less' : `Show ${articles.length - maxVisible} More`}
        </button>
      )}
    </section>
  );
}
