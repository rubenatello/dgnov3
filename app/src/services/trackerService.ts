import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Tracker, TrackerIncident } from '../types/models';

// Helper function to remove undefined values from an object before saving to Firestore
function removeUndefinedFields(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        result[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? removeUndefinedFields(item as Record<string, unknown>)
            : item
        );
      } else if (typeof value === 'object' && value !== null) {
        result[key] = removeUndefinedFields(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

// Tracker CRUD operations
export async function createTracker(tracker: Omit<Tracker, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const cleanedTracker = removeUndefinedFields({
    ...tracker,
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
  });
  const docRef = await addDoc(collection(db, 'trackers'), cleanedTracker);
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

// Public function for guests - only gets active trackers
export async function getActiveTrackers(): Promise<Tracker[]> {
  const q = query(
    collection(db, 'trackers'),
    where('isActive', '==', true),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tracker));
}

export async function updateTracker(id: string, updates: Partial<Tracker>): Promise<void> {
  const cleanedUpdates = removeUndefinedFields({ 
    ...updates, 
    updatedAt: Timestamp.fromDate(new Date()) 
  });
  await updateDoc(doc(db, 'trackers', id), cleanedUpdates);
}

export async function deleteTracker(id: string): Promise<void> {
  await deleteDoc(doc(db, 'trackers', id));
}

// TrackerIncident CRUD operations
export async function addIncident(trackerId: string, incident: Omit<TrackerIncident, 'id' | 'createdAt'>): Promise<string> {
  const cleanedIncident = removeUndefinedFields({
    ...incident,
    trackerId,
    createdAt: Timestamp.fromDate(new Date()),
  });
  const docRef = await addDoc(collection(db, 'trackerIncidents'), cleanedIncident);
  
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
  const cleanedUpdates = removeUndefinedFields({
    ...updates,
    updatedAt: Timestamp.fromDate(new Date()),
  });
  await updateDoc(doc(db, 'trackerIncidents', id), cleanedUpdates);
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