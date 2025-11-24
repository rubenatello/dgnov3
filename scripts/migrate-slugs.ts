/**
 * Migration Script: Fix Article Slugs
 * 
 * This script updates existing articles that have slugs with the old format
 * (articles/YYYY/MM/DD/slug) to the new format (YYYY/MM/DD/slug)
 * 
 * Run this ONCE after deploying the slug generation fix
 * 
 * Usage:
 * 1. Make sure you're authenticated to Firebase
 * 2. Run: node migrate-slugs.js (or ts-node if using TypeScript)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Use your Firebase config
const firebaseConfig = {
  // Copy from app/src/config/firebase.ts
  // Or set via environment variables
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateArticleSlugs() {
  console.log('🔍 Starting article slug migration...\n');
  
  const articlesRef = collection(db, 'articles');
  const snapshot = await getDocs(articlesRef);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const docSnap of snapshot.docs) {
    const article = docSnap.data();
    const articleId = docSnap.id;
    
    // Check if slug needs migration
    if (article.slug?.startsWith('articles/')) {
      try {
        // Remove 'articles/' prefix
        const newSlug = article.slug.replace('articles/', '');
        
        await updateDoc(doc(db, 'articles', articleId), {
          slug: newSlug
        });
        
        updated++;
        console.log(`✅ Migrated: ${article.slug} -> ${newSlug}`);
      } catch (error) {
        errors++;
        console.error(`❌ Error migrating article ${articleId}:`, error);
      }
    } else {
      skipped++;
      console.log(`⏭️  Skipped: ${article.slug || 'no slug'} (already correct or missing)`);
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${snapshot.size}`);
  
  if (updated > 0) {
    console.log('\n✨ Migration completed successfully!');
  } else {
    console.log('\n⚠️  No articles needed migration.');
  }
}

// Run migration
migrateArticleSlugs()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
