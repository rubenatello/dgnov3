import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Check if user is a subscriber
export async function isUserSubscriber(userId: string): Promise<boolean> {
  try {
    const subscriberDoc = await getDoc(doc(db, 'subscribers', userId));
    return subscriberDoc.exists() && subscriberDoc.data()?.isActive === true;
  } catch (error) {
    console.error('Error checking subscriber status:', error);
    return false;
  }
}

// Check if user has premium access (subscriber or staff)
export async function hasDownloadAccess(userId: string, userRoles: string[] = []): Promise<boolean> {
  try {
    // Staff members always have access
    const staffRoles = ['writer', 'editor', 'admin', 'superuser'];
    const isStaff = userRoles.some(role => staffRoles.includes(role));
    
    if (isStaff) return true;
    
    // Check if user is a subscriber
    return await isUserSubscriber(userId);
  } catch (error) {
    console.error('Error checking download access:', error);
    return false;
  }
}