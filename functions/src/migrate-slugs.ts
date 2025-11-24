/**
 * Migration Script: Fix Article Slugs
 * 
 * This script updates existing articles that have slugs with the old format
 * (articles/YYYY/MM/DD/slug) to the new format (YYYY/MM/DD/slug)
 * 
 * Run this ONCE after deploying the slug generation fix
 * 
 * Usage from functions directory:
 * 1. cd functions
 * 2. npm run build
 * 3. Set GOOGLE_APPLICATION_CREDENTIALS or GCLOUD_PROJECT:
 *    $env:GCLOUD_PROJECT="dgno-675a8"
 * 4. node lib/migrate-slugs.js
 * 
 * Or run directly with ts-node:
 * ts-node src/migrate-slugs.ts
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'dgno-675a8'
  });
}

const db = admin.firestore();

async function migrateArticleSlugs() {
  console.log('🔍 Starting article slug migration...\n');
  
  const articlesRef = db.collection('articles');
  const snapshot = await articlesRef.get();
  
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
        
        await docSnap.ref.update({
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
    console.log('   Example: https://dgno.us/article/2025/11/24/your-article-title');
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
