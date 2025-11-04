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

// Check if user is staff member
export async function isStaffMember(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    return userData.isStaff === true;
  } catch (error) {
    console.error('Error checking staff status:', error);
    return false;
  }
}

// Check if user can download CSV (subscribers or staff members)
export async function canDownloadCSV(userId?: string): Promise<boolean> {
  if (!userId) {
    return false; // Not logged in
  }
  
  // Check if user is staff first (faster check)
  const isStaff = await isStaffMember(userId);
  if (isStaff) {
    return true;
  }
  
  // If not staff, check if they're an active subscriber
  return await isActiveSubscriber(userId);
}