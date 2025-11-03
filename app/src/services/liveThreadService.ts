import { db } from '../config/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs } from 'firebase/firestore';
import type { LiveThread } from '../types/models';

export async function addThread(liveArticleId: string, thread: Omit<LiveThread, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'liveArticles', liveArticleId, 'threads'), {
    ...thread,
    createdAt: new Date(),
  });
  return docRef.id;
}

export async function getThreads(liveArticleId: string): Promise<LiveThread[]> {
  const q = query(
    collection(db, 'liveArticles', liveArticleId, 'threads'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveThread));
}

export async function updateThread(liveArticleId: string, threadId: string, updates: Partial<LiveThread>): Promise<void> {
  await updateDoc(doc(db, 'liveArticles', liveArticleId, 'threads', threadId), {
    ...updates,
    editedAt: new Date(),
  });
}

export async function deleteThread(liveArticleId: string, threadId: string): Promise<void> {
  await deleteDoc(doc(db, 'liveArticles', liveArticleId, 'threads', threadId));
}