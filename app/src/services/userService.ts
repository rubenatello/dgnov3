import { collection, getDocs, query, where, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from '../types/models';

export type StaffUser = {
  id: string;
  displayName: string;
  email?: string;
};

export async function getWritersAndEditors(): Promise<StaffUser[]> {
  const users: Record<string, StaffUser> = {};

  try {
    const qWriter = query(collection(db, 'users'), where('rolesMap.writer', '==', true));
    const qEditor = query(collection(db, 'users'), where('rolesMap.editor', '==', true));

    const [snapWriter, snapEditor] = await Promise.all([getDocs(qWriter), getDocs(qEditor)]);

    snapWriter.forEach(d => {
      const dataRec = d.data() as Record<string, unknown> | undefined;
      const displayName = dataRec && typeof dataRec.displayName === 'string'
        ? dataRec.displayName
        : dataRec && typeof dataRec.name === 'string'
        ? dataRec.name
        : dataRec && typeof dataRec.email === 'string'
        ? dataRec.email
        : d.id;
      const email = dataRec && typeof dataRec.email === 'string' ? dataRec.email : undefined;
      users[d.id] = { id: d.id, displayName, email };
    });

    snapEditor.forEach(d => {
      if (!users[d.id]) {
        const dataRec = d.data() as Record<string, unknown> | undefined;
        const displayName = dataRec && typeof dataRec.displayName === 'string'
          ? dataRec.displayName
          : dataRec && typeof dataRec.name === 'string'
          ? dataRec.name
          : dataRec && typeof dataRec.email === 'string'
          ? dataRec.email
          : d.id;
        const email = dataRec && typeof dataRec.email === 'string' ? dataRec.email : undefined;
        users[d.id] = { id: d.id, displayName, email };
      }
    });
  } catch (err) {
    console.warn('Failed to load writers/editors:', err);
  }

  return Object.values(users);
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    // Remove any undefined values — Firestore rejects undefined field values in update
    const cleaned: Record<string, unknown> = {};
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v !== undefined) cleaned[k] = v as unknown;
    });

    await updateDoc(userRef, {
      ...cleaned,
      lastUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
