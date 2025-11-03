import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import type { LiveArticle } from '../types/models';

export async function createLiveArticle(article: Omit<LiveArticle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'liveArticles'), {
    ...article,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function getLiveArticle(id: string): Promise<LiveArticle | null> {
  const docSnap = await getDoc(doc(db, 'liveArticles', id));
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as LiveArticle) : null;
}

export async function getLiveArticles(status?: 'open' | 'closed', limitCount = 10): Promise<LiveArticle[]> {
  const q = query(
    collection(db, 'liveArticles'),
    ...(status ? [where('status', '==', status)] : []),
    orderBy('updatedAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveArticle));
}

export async function updateLiveArticle(id: string, updates: Partial<LiveArticle>): Promise<void> {
  await updateDoc(doc(db, 'liveArticles', id), { ...updates, updatedAt: new Date() });
}

export async function deleteLiveArticle(id: string): Promise<void> {
  await deleteDoc(doc(db, 'liveArticles', id));
}