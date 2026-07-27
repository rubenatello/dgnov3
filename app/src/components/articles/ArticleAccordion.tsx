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
    <section className="mb-8 sm:mb-10">
      <div className="flex items-center gap-4 border-b-2 border-accent pb-3 mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-ink uppercase tracking-wide">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-accent/20 to-transparent" />
        <span className="rounded-full bg-stone-light px-2 py-1 text-xs font-semibold text-ink-muted">{articles.length} articles</span>
      </div>
      
      <div className="space-y-0">
        {visibleArticles.map((article) => (
          <ArticleCard 
            key={article.id} 
            article={article} 
            variant={variant}
          />
        ))}
      </div>
      
      {hasMore && (
        <button
          className="mt-5 px-5 py-2.5 text-sm font-semibold text-accent border-2 border-accent hover:bg-accent hover:text-white rounded-lg transition-all duration-200 w-full sm:w-auto flex items-center justify-center gap-2 group"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <span>Show Less</span>
              <span className="group-hover:translate-y-[-2px] transition-transform">↑</span>
            </>
          ) : (
            <>
              <span>Show {articles.length - maxVisible} More</span>
              <span className="group-hover:translate-y-[2px] transition-transform">↓</span>
            </>
          )}
        </button>
      )}
    </section>
  );
}
