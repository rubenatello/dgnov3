// Script to fix user roles to match the expected lowercase format
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Firebase config (you may need to update this with your actual config)
const firebaseConfig = {
  // Add your config here if this doesn't work
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixUserRoles() {
  try {
    const userId = 'iShHV0T4k00NamaliJP5ZkMZJgg2'; // Your user ID from the screenshot
    
    // Update the roles to lowercase format
    await updateDoc(doc(db, 'users', userId), {
      roles: ['superuser', 'admin', 'editor', 'writer']
    });
    
    console.log('✅ User roles updated successfully!');
    console.log('New roles: ["superuser", "admin", "editor", "writer"]');
  } catch (error) {
    console.error('❌ Error updating user roles:', error);
  }
}

fixUserRoles();