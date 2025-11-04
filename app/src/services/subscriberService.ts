import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface SubscriberData {
  id: string;
  userId: string;
  email: string;
  status: 'active' | 'inactive' | 'canceled';
  tier: 'basic' | 'premium' | 'pro';
  createdAt: Date;
  expiresAt?: Date;
}

// Check if user is an active subscriber
export async function isActiveSubscriber(userId: string): Promise<boolean> {
  try {
    const subscriberDoc = await getDoc(doc(db, 'subscribers', userId));
    
    if (!subscriberDoc.exists()) {
      return false;
    }
    
    const data = subscriberDoc.data() as SubscriberData;
    
    // Check if subscription is active
    if (data.status !== 'active') {
      return false;
    }
    
    // Check if subscription hasn't expired (if expiration date exists)
    if (data.expiresAt && data.expiresAt < new Date()) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking subscriber status:', error);
    return false;
  }
}

// Get subscriber data
export async function getSubscriberData(userId: string): Promise<SubscriberData | null> {
  try {
    const subscriberDoc = await getDoc(doc(db, 'subscribers', userId));
    
    if (!subscriberDoc.exists()) {
      return null;
    }
    
    return subscriberDoc.data() as SubscriberData;
  } catch (error) {
    console.error('Error getting subscriber data:', error);
    return null;
  }
}

// Check if user can download CSV (subscribers only)
export async function canDownloadCSV(userId?: string): Promise<boolean> {
  if (!userId) {
    return false; // Not logged in
  }
  
  return await isActiveSubscriber(userId);
}