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
