/**
 * Migration Script: Fix Article Slugs
 * 
 * This script updates existing articles that have slugs with the old format
 * (articles/YYYY/MM/DD/slug) to the new format (YYYY/MM/DD/slug)
 * 
 * Run this ONCE after deploying the slug generation fix
 * 
 * IMPORTANT: This script requires Firebase Admin authentication
 * 
 * Option 1 - Use Firebase Emulator:
 *   firebase emulators:start
 *   (in another terminal) node app/scripts/migrate-slugs.js --emulator
 * 
 * Option 2 - Use Firebase Admin from functions folder:
 *   See functions/src/migrate-slugs.ts instead
 * 
 * Option 3 - Run as Cloud Function (Recommended):
 *   Deploy the migration as a one-time callable function
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration from your project
const firebaseConfig = {
  apiKey: "AIzaSyBn5GWdFHfWsdC8utmhZcXX9hMMnQG3xgU",
  authDomain: "dgno-675a8.firebaseapp.com",
  projectId: "dgno-675a8",
  storageBucket: "dgno-675a8.firebasestorage.app",
  messagingSenderId: "626313501573",
  appId: "1:626313501573:web:AIzaSyBn5GWdFHfWsdC8utmhZcXX9hMMnQG3xgU"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Check if running against emulator
const useEmulator = process.argv.includes('--emulator');
if (useEmulator) {
  console.log('🔧 Connecting to Firebase Emulator...\n');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

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
        console.log(`   Title: ${article.title || 'No title'}`);
        console.log('');
      } catch (error) {
        errors++;
        console.error(`❌ Error migrating article ${articleId}:`, error);
      }
    } else {
      skipped++;
      if (skipped <= 5) { // Only show first 5 skipped items
        console.log(`⏭️  Skipped: ${article.slug || 'no slug'} (already correct or missing)`);
      }
    }
  }
  
  if (skipped > 5) {
    console.log(`⏭️  ... and ${skipped - 5} more skipped\n`);
  }
  
  console.log('═══════════════════════════════════════');
  console.log('📊 Migration Summary');
  console.log('═══════════════════════════════════════');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📄 Total: ${snapshot.size}`);
  console.log('═══════════════════════════════════════\n');
  
  if (updated > 0) {
    console.log('✨ Migration completed successfully!');
    console.log('');
    console.log('⚠️  IMPORTANT: Test your article pages to ensure they load correctly');
    console.log('   Example URL format: https://dgno.us/article/2025/11/24/your-article-title');
  } else {
    console.log('⚠️  No articles needed migration.');
    console.log('   This might mean:');
    console.log('   1. All articles already have correct slugs');
    console.log('   2. No articles exist in the database');
    console.log('   3. Articles don\'t have slug fields');
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
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  });
