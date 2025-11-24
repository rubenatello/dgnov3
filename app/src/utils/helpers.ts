
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
 * Format: YYYY/MM/DD/article-title-here (without 'articles/' prefix)
 * Routes expect /article/:yyyy/:mm/:dd/:slug pattern
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
  
  return `${year}/${month}/${day}/${titleSlug}`;
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

/**
 * Generate a URL-friendly slug from a tag
 * Example: "Human Rights" => "human-rights"
 */
export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')      // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/--+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '');      // Trim leading/trailing hyphens
}

export function unslugifyTag(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize each word
}

// ========================================
// CSV Export Functions for Trackers
// ========================================

import type { Tracker, TrackerIncident, TrackerField } from '../types/models';

/**
 * Convert tracker incidents to CSV and download
 * Handles both legacy and custom field trackers automatically
 */
export function downloadTrackerCSV(tracker: Tracker, incidents: TrackerIncident[]): void {
  if (!tracker || !incidents.length) {
    alert('No data to export');
    return;
  }

  const csvContent = generateTrackerCSV(tracker, incidents);
  const fileName = `${tracker.slug || 'tracker'}-incidents-${formatDateForFilename(new Date())}.csv`;
  
  downloadCSVFile(csvContent, fileName);
}

/**
 * Generate CSV content from tracker data
 * Automatically detects legacy vs custom field format
 */
export function generateTrackerCSV(tracker: Tracker, incidents: TrackerIncident[]): string {
  if (!incidents.length) return '';
  
  // Determine if this is a custom fields tracker
  const isCustomTracker = tracker.useCustomFields && tracker.customFields?.length;
  
  if (isCustomTracker) {
    return generateCustomFieldsCSV(tracker.customFields!, incidents);
  } else {
    return generateLegacyFieldsCSV(incidents);
  }
}

/**
 * Generate CSV for trackers with custom fields
 */
function generateCustomFieldsCSV(fields: TrackerField[], incidents: TrackerIncident[]): string {
  // Sort fields by order for consistent column arrangement
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);
  
  // Create header row
  const headers = sortedFields.map(field => escapeCSVField(field.name));
  const headerRow = headers.join(',');
  
  // Create data rows
  const dataRows = incidents.map(incident => {
    const values = sortedFields.map(field => {
      const value = incident.customData?.[field.id] || '';
      return escapeCSVField(formatFieldValue(field, value));
    });
    return values.join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Generate CSV for legacy trackers (standard fields)
 */
function generateLegacyFieldsCSV(incidents: TrackerIncident[]): string {
  const headers = [
    'Date',
    'Location', 
    'City',
    'State',
    'Description',
    'Body Cam Available',
    'Video Available',
    'Created Date'
  ];
  const headerRow = headers.map(h => escapeCSVField(h)).join(',');
  
  const dataRows = incidents.map(incident => {
    const values = [
      formatDateValue(incident.dateOfOccurrence),
      incident.location || '',
      incident.city || '',
      incident.state || '',
      incident.description || '',
      incident.bodyCamAvailable ? 'Yes' : 'No',
      incident.bodyCamVideoId ? 'Yes' : 'No',
      formatDateValue(incident.createdAt)
    ];
    return values.map(v => escapeCSVField(v)).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Format field values based on field type
 */
function formatFieldValue(field: TrackerField, value: string | number | boolean | Date): string {
  if (!value && value !== 0 && value !== false) return '';
  
  switch (field.type) {
    case 'date':
      return formatDateValue(value);
    case 'checkbox':
      return value ? 'Yes' : 'No';
    case 'url':
      return String(value);
    case 'number':
      return String(value);
    default:
      return String(value);
  }
}

/**
 * Format date values consistently
 */
function formatDateValue(dateValue: unknown): string {
  if (!dateValue) return '';
  
  try {
    let date: Date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
      // Firestore Timestamp
      date = (dateValue as { toDate: () => Date }).toDate();
    } else {
      date = new Date(String(dateValue));
    }
    
    // Format as YYYY-MM-DD for CSV consistency
    return date.toISOString().split('T')[0];
  } catch {
    return String(dateValue);
  }
}

/**
 * Escape CSV field values (handle commas, quotes, newlines)
 */
function escapeCSVField(value: string): string {
  const stringValue = String(value || '');
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Format date for filename (YYYY-MM-DD)
 */
function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Download CSV content as file
 */
function downloadCSVFile(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    // Modern browsers
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback for older browsers
    alert('CSV download not supported in this browser');
  }
}

/**
 * Download multiple trackers as separate CSV files (bulk export)
 */
export async function downloadAllTrackersCSV(trackers: Tracker[], getIncidents: (trackerId: string) => Promise<TrackerIncident[]>): Promise<void> {
  if (!trackers.length) {
    alert('No trackers to export');
    return;
  }
  
  try {
    for (const tracker of trackers) {
      if (!tracker.id) continue;
      
      const incidents = await getIncidents(tracker.id);
      if (incidents.length > 0) {
        downloadTrackerCSV(tracker, incidents);
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } catch (error) {
    console.error('Error during bulk export:', error);
    alert('Error during bulk export. Some files may not have downloaded.');
  }
}
