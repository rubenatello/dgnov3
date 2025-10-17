import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Tag } from '../types/models';

/**
 * Generate URL-safe slug from tag name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get all tags, ordered by usage count (most used first)
 */
export async function getAllTags(): Promise<Tag[]> {
  const q = query(
    collection(db, 'tags'),
    orderBy('usageCount', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Tag[];
}

/**
 * Search tags by name (for autocomplete)
 */
export async function searchTags(searchTerm: string): Promise<Tag[]> {
  const allTags = await getAllTags();
  
  // Client-side filtering for substring match
  return allTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

/**
 * Get a single tag by slug
 */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const q = query(
    collection(db, 'tags'),
    where('slug', '==', slug),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as Tag;
}

/**
 * Create a new tag or get existing one
 * Returns the tag ID
 */
export async function createOrGetTag(name: string, userId: string): Promise<string> {
  const slug = generateSlug(name);
  
  // Check if tag already exists
  const existing = await getTagBySlug(slug);
  if (existing && existing.id) {
    return existing.id;
  }
  
  // Create new tag
  const newTag: Omit<Tag, 'id'> = {
    name: name.trim(),
    slug,
    usageCount: 0,
    createdAt: Timestamp.now(),
    createdBy: userId,
  };
  
  const docRef = await addDoc(collection(db, 'tags'), newTag);
  return docRef.id;
}

/**
 * Increment tag usage count when used in an article
 */
export async function incrementTagUsage(tagName: string): Promise<void> {
  const slug = generateSlug(tagName);
  const tag = await getTagBySlug(slug);
  
  if (!tag || !tag.id) {
    console.warn(`Tag not found: ${tagName}`);
    return;
  }
  
  const tagRef = doc(db, 'tags', tag.id);
  await updateDoc(tagRef, {
    usageCount: (tag.usageCount || 0) + 1,
    lastUsed: serverTimestamp(),
  });
}

/**
 * Decrement tag usage count when removed from an article
 */
export async function decrementTagUsage(tagName: string): Promise<void> {
  const slug = generateSlug(tagName);
  const tag = await getTagBySlug(slug);
  
  if (!tag || !tag.id) {
    console.warn(`Tag not found: ${tagName}`);
    return;
  }
  
  const tagRef = doc(db, 'tags', tag.id);
  const newCount = Math.max(0, (tag.usageCount || 0) - 1);
  
  await updateDoc(tagRef, {
    usageCount: newCount,
  });
}

/**
 * Update tag usage counts when article tags change
 * Increments new tags, decrements removed tags
 */
export async function updateTagUsageCounts(
  oldTags: string[],
  newTags: string[]
): Promise<void> {
  // Find removed tags
  const removed = oldTags.filter(tag => !newTags.includes(tag));
  
  // Find added tags
  const added = newTags.filter(tag => !oldTags.includes(tag));
  
  // Update counts
  await Promise.all([
    ...removed.map(tag => decrementTagUsage(tag)),
    ...added.map(tag => incrementTagUsage(tag)),
  ]);
}

/**
 * Get popular tags (for tag cloud or suggestions)
 */
export async function getPopularTags(limitCount: number = 20): Promise<Tag[]> {
  const q = query(
    collection(db, 'tags'),
    orderBy('usageCount', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Tag[];
}
