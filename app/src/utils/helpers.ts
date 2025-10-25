import type { Article } from "../types/models";

/**
 * Get the featured article (breaking > highest viewCount > most recent)
 */
export function getFeaturedArticle(articles: Article[]): Article | undefined {
  if (!articles.length) return undefined;
  
  // First check for breaking news
  const now = Date.now();
  const breakingArticles = articles.filter(a => {
    const _b: unknown = a.breakingUntil;
    const breakingUntil = _b instanceof Date ? _b : _b ? new Date(String(_b)) : null;
    return breakingUntil && breakingUntil.getTime() > now;
  });
  
  if (breakingArticles.length > 0) {
    // Return most recent breaking news
    return breakingArticles.sort((a, b) => {
      const dateA = a.publishedAt instanceof Date ? a.publishedAt : new Date(String(a.publishedAt));
      const dateB = b.publishedAt instanceof Date ? b.publishedAt : new Date(String(b.publishedAt));
      return dateB.getTime() - dateA.getTime();
    })[0];
  }
  
  // Otherwise, prefer highest viewCount, fallback to most recent
  const sorted = [...articles].sort((a, b) => {
    const viewsA = a.viewCount || 0;
    const viewsB = b.viewCount || 0;
    if (viewsA !== viewsB) return viewsB - viewsA;
    const dateA = a.publishedAt instanceof Date ? a.publishedAt : new Date(String(a.publishedAt));
    const dateB = b.publishedAt instanceof Date ? b.publishedAt : new Date(String(b.publishedAt));
    return dateB.getTime() - dateA.getTime();
  });
  return sorted[0];
}

/**
 * Get top stories (excluding featured, prioritizing recent and high engagement)
 */
export function getTopStories(articles: Article[], featured?: Article, count = 4): Article[] {
  const filtered = articles.filter(a => (a.id ?? "") !== (featured?.id ?? ""));
  
  // Sort by engagement score: (viewCount * 0.7) + (recency score * 0.3)
  const scored = filtered.map(article => {
    const views = article.viewCount || 0;
    const date = article.publishedAt instanceof Date ? article.publishedAt : new Date(String(article.publishedAt));
    const hoursAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 100 - hoursAgo); // Higher score for more recent
    const engagementScore = (views * 0.7) + (recencyScore * 0.3);
    
    return { article, score: engagementScore };
  });
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(item => item.article);
}

/**
 * Get latest articles (most recent, excluding featured and top stories)
 */
export function getLatestArticles(articles: Article[], excludeIds: string[] = [], count = 5): Article[] {
  const filtered = articles.filter(a => !excludeIds.includes(a.id ?? ""));
  
  return filtered
    .sort((a, b) => {
      const dateA = a.publishedAt instanceof Date ? a.publishedAt : new Date(String(a.publishedAt));
      const dateB = b.publishedAt instanceof Date ? b.publishedAt : new Date(String(b.publishedAt));
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, count);
}

/**
 * Get sidebar articles (trending by engagement)
 */
export function getSidebarArticles(articles: Article[], excludeIds: string[] = [], count = 5): Article[] {
  const filtered = articles.filter(a => !excludeIds.includes(a.id ?? ""));
  
  return filtered
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, count);
}

/**
 * Generate a URL-friendly slug from a title
 * Format: articles/YYYY/MM/DD/article-title-here
 */
export function generateSlug(title: string, date?: Date): string {
  const publishDate = date || new Date();
  const year = publishDate.getFullYear();
  const month = String(publishDate.getMonth() + 1).padStart(2, '0');
  const day = String(publishDate.getDate()).padStart(2, '0');
  
  const titleSlug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .trim();
  
  return `articles/${year}/${month}/${day}/${titleSlug}`;
}

/**
 * Validate summary length (max 300 characters)
 */
export function validateSummary(summary: string): boolean {
  return summary.length <= 300;
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Format a Firestore Timestamp to a readable date
 */
export function formatDate(timestamp: unknown): string {
  if (!timestamp) return '';
  const date = (timestamp as { toDate?: () => Date }).toDate ? (timestamp as { toDate: () => Date }).toDate() : new Date(timestamp as string | number | Date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}


/** 
 * Calculate estimated reading time based on word count
 */
export function estimateReadingTime(text: string): string {
  const wordsPerMinute = 200; // Average reading speed
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * Get articles published today
 * @param articles List of articles
 * @returns Articles published today
 */
export function getTodaysArticles(articles: Article[]): Article[] {
  const today = new Date();
  return articles.filter(a => {
    const date = a.publishedAt instanceof Date
      ? a.publishedAt
      : new Date(String(a.publishedAt));
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  });
}

/**
 * Get trending articles based on viewCount
 * @param articles List of articles
 */
export function getTrendingArticles(articles: Article[], count = 3): Article[] {
  return [...articles]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, count);
}

/** * Get articles related to the Trump presidency
 * @param articles List of articles
 * @returns Articles related to Trump presidency
 */
export function getTrumpPresidencyArticles(articles: Article[]): Article[] {
  const keywords = ['Donald Trump', 'Trump Administration', 'Trump'];
  return articles.filter(a =>
    (a.tags || []).some(tag =>
      keywords.some(kw => tag.toLowerCase().includes(kw.toLowerCase()))
    )
  );
}