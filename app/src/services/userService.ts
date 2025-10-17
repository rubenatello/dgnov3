import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

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
