import type { Timestamp } from 'firebase/firestore';

/**
 * Safely formats a date value that could be a Firestore Timestamp, Date, or string
 * @param dateValue - The date value to format
 * @param defaultValue - The default value to return if formatting fails
 * @returns Formatted date string or default value
 */
export function formatDate(dateValue: unknown, defaultValue: string = 'N/A'): string {
  return toDate(dateValue)?.toLocaleDateString() || defaultValue;
}

/**
 * Safely gets a Date object from a Firestore Timestamp or other date value
 * @param dateValue - The date value to convert
 * @returns Date object or null if conversion fails
 */
export function toDate(dateValue: unknown): Date | null {
  if (dateValue === null || dateValue === undefined || dateValue === '') return null;

  try {
    let date: Date | null = null;

    if (dateValue instanceof Date) {
      date = new Date(dateValue.getTime());
    } else if (typeof dateValue === 'object') {
      const timestamp = dateValue as Partial<Timestamp> & {
        seconds?: unknown;
        nanoseconds?: unknown;
        _seconds?: unknown;
        _nanoseconds?: unknown;
      };

      if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else {
        // Some legacy tracker imports stored Timestamp-shaped plain maps
        // instead of Firestore Timestamp values. Support both public SDK and
        // Admin SDK property names without treating arbitrary objects as dates.
        const rawSeconds = timestamp.seconds ?? timestamp._seconds;
        const rawNanoseconds = timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0;
        const seconds = typeof rawSeconds === 'number' || typeof rawSeconds === 'string'
          ? Number(rawSeconds)
          : Number.NaN;
        const nanoseconds = typeof rawNanoseconds === 'number' || typeof rawNanoseconds === 'string'
          ? Number(rawNanoseconds)
          : Number.NaN;

        if (
          Number.isFinite(seconds) &&
          Number.isInteger(seconds) &&
          Number.isFinite(nanoseconds) &&
          Number.isInteger(nanoseconds) &&
          nanoseconds >= 0 &&
          nanoseconds < 1_000_000_000
        ) {
          date = new Date((seconds * 1000) + (nanoseconds / 1_000_000));
        }
      }
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      date = new Date(dateValue);
    }

    return date && Number.isFinite(date.getTime()) ? date : null;
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
