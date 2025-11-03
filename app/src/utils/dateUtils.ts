import type { Timestamp } from 'firebase/firestore';

/**
 * Safely formats a date value that could be a Firestore Timestamp, Date, or string
 * @param dateValue - The date value to format
 * @param defaultValue - The default value to return if formatting fails
 * @returns Formatted date string or default value
 */
export function formatDate(dateValue: unknown, defaultValue: string = 'N/A'): string {
  if (!dateValue) return defaultValue;
  
  try {
    // If it's a Firestore Timestamp
    if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
      return (dateValue as Timestamp).toDate().toLocaleDateString();
    }
    
    // If it's already a Date object or date string/number
    return new Date(dateValue as string | number | Date).toLocaleDateString();
  } catch {
    return defaultValue;
  }
}

/**
 * Safely gets a Date object from a Firestore Timestamp or other date value
 * @param dateValue - The date value to convert
 * @returns Date object or null if conversion fails
 */
export function toDate(dateValue: unknown): Date | null {
  if (!dateValue) return null;
  
  try {
    // If it's a Firestore Timestamp
    if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
      return (dateValue as Timestamp).toDate();
    }
    
    // If it's already a Date object or date string/number
    return new Date(dateValue as string | number | Date);
  } catch {
    return null;
  }
}

/**
 * Safely gets the year from a date value
 * @param dateValue - The date value to get year from
 * @returns Year number or null if extraction fails
 */
export function getYear(dateValue: unknown): number | null {
  const date = toDate(dateValue);
  return date ? date.getFullYear() : null;
}

/**
 * Safely formats a date for ISO input fields (YYYY-MM-DD)
 * @param dateValue - The date value to format
 * @returns ISO date string or empty string if formatting fails
 */
export function formatDateForInput(dateValue: unknown): string {
  const date = toDate(dateValue);
  if (!date) return '';
  
  try {
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}