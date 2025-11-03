import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Tracker, TrackerIncident } from '../types/models';

// Tracker CRUD operations
export async function createTracker(tracker: Omit<Tracker, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'trackers'), {
    ...tracker,
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
  });
  return docRef.id;
}

export async function getTracker(id: string): Promise<Tracker | null> {
  const docSnap = await getDoc(doc(db, 'trackers', id));
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Tracker) : null;
}

export async function getTrackers(isActive = true, limitCount = 50): Promise<Tracker[]> {
  const q = query(
    collection(db, 'trackers'),
    where('isActive', '==', isActive),
    orderBy('updatedAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tracker));
}

export async function getAllTrackers(): Promise<Tracker[]> {
  const q = query(
    collection(db, 'trackers'),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tracker));
}

export async function updateTracker(id: string, updates: Partial<Tracker>): Promise<void> {
  await updateDoc(doc(db, 'trackers', id), { 
    ...updates, 
    updatedAt: Timestamp.fromDate(new Date()) 
  });
}

export async function deleteTracker(id: string): Promise<void> {
  await deleteDoc(doc(db, 'trackers', id));
}

// TrackerIncident CRUD operations
export async function addIncident(trackerId: string, incident: Omit<TrackerIncident, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'trackerIncidents'), {
    ...incident,
    trackerId,
    createdAt: Timestamp.fromDate(new Date()),
  });
  
  // Update tracker's incident count and updatedAt
  const incidentsCount = await getIncidentCount(trackerId);
  await updateTracker(trackerId, { incidentCount: incidentsCount + 1 });
  
  return docRef.id;
}

export async function getIncident(id: string): Promise<TrackerIncident | null> {
  const docSnap = await getDoc(doc(db, 'trackerIncidents', id));
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as TrackerIncident) : null;
}

export async function getIncidents(trackerId: string, limitCount = 100): Promise<TrackerIncident[]> {
  const q = query(
    collection(db, 'trackerIncidents'),
    where('trackerId', '==', trackerId),
    where('status', '==', 'active'),
    orderBy('dateOfOccurrence', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrackerIncident));
}

export async function getIncidentCount(trackerId: string): Promise<number> {
  const q = query(
    collection(db, 'trackerIncidents'),
    where('trackerId', '==', trackerId),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export async function updateIncident(id: string, updates: Partial<TrackerIncident>): Promise<void> {
  await updateDoc(doc(db, 'trackerIncidents', id), {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

export async function deleteIncident(id: string): Promise<void> {
  const incident = await getIncident(id);
  if (incident) {
    await deleteDoc(doc(db, 'trackerIncidents', id));
    
    // Update tracker's incident count
    const incidentsCount = await getIncidentCount(incident.trackerId);
    await updateTracker(incident.trackerId, { incidentCount: incidentsCount });
  }
}