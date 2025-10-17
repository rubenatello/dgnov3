import { db, storage } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  type Query as FireQuery,
  type DocumentData
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import type { Media } from '../types/models';

const MEDIA_COLLECTION = 'media';

// Upload file to Firebase Storage and return download URL
export async function uploadMediaFile(file: File, folder: string = 'images') {
  try {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    
    // Upload with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString()
      }
    };
    
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Add media metadata to Firestore
export async function addMedia(meta: Omit<Media, 'id'>) {
  const docRef = await addDoc(collection(db, MEDIA_COLLECTION), meta);
  return docRef.id;
}

// Get all media (optionally filter by type)
export async function getAllMedia(type?: 'image' | 'video') {
  // Start from collection reference but treat it as a Query to allow conditional refinements
  const baseRef = collection(db, MEDIA_COLLECTION);
  let q: FireQuery<DocumentData> = baseRef as unknown as FireQuery<DocumentData>;
  if (type) {
    q = query(q, where('type', '==', type));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Media[];
}

// Update media metadata
export async function updateMedia(id: string, data: Partial<Media>) {
  await updateDoc(doc(db, MEDIA_COLLECTION, id), data);
}

// Delete media from Firestore and Storage
export async function deleteMedia(id: string, fileUrl: string) {
  await deleteDoc(doc(db, MEDIA_COLLECTION, id));
  // Remove from Storage
  const fileRef = ref(storage, fileUrl.replace(/^.*\/o\//, ''));
  await deleteObject(fileRef);
}
