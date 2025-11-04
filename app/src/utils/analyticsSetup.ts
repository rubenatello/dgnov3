/**
 * Analytics Setup Script
 * 
 * This script initializes analytics data for existing articles and can add demo data for testing.
 * Run this in your browser console on the dashboard to set up analytics.
 */

import { initializeAnalyticsForExistingArticles, addDemoAnalyticsData } from '../services/analyticsService';

// Initialize analytics for existing articles (sets viewCount/likeCount to 0 if missing)
export async function setupAnalytics() {
  console.log('🚀 Setting up analytics for existing articles...');
  
  try {
    const result = await initializeAnalyticsForExistingArticles();
    
    if (result.success) {
      console.log(`✅ Analytics setup complete! Updated ${result.articlesUpdated} articles.`);
      console.log('📊 Your analytics dashboard should now show data.');
      return result;
    } else {
      console.error('❌ Analytics setup failed:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Error during analytics setup:', error);
    return { success: false, error: String(error) };
  }
}

// Add demo data for testing (optional - use only for testing)
export async function setupDemoData() {
  const confirmed = confirm(
    '⚠️ This will add random view and like counts to your articles for testing. ' +
    'Only use this for testing purposes. Continue?'
  );
  
  if (!confirmed) {
    console.log('Demo data setup cancelled.');
    return;
  }
  
  console.log('🎲 Adding demo analytics data...');
  
  try {
    const result = await addDemoAnalyticsData();
    
    if (result.success) {
      console.log(`✅ Demo data added! Updated ${result.articlesUpdated} articles with random view/like counts.`);
      console.log('📊 Your analytics dashboard should now show demo data.');
      console.log('🔄 Refresh your analytics page to see the changes.');
      return result;
    } else {
      console.error('❌ Demo data setup failed:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Error during demo data setup:', error);
    return { success: false, error: String(error) };
  }
}

// Combined setup function
export async function fullAnalyticsSetup(includeDemoData = false) {
  console.log('🔧 Starting full analytics setup...');
  
  // Step 1: Initialize basic analytics
  const initResult = await setupAnalytics();
  
  if (!initResult.success) {
    return initResult;
  }
  
  // Step 2: Add demo data if requested
  if (includeDemoData) {
    await setupDemoData();
  }
  
  console.log('🎉 Full analytics setup complete!');
  console.log('📝 Next steps:');
  console.log('1. Visit your analytics dashboard to see the data');
  console.log('2. View any article to test view tracking');
  console.log('3. Like articles to test like tracking');
  
  return { success: true };
}

// Functions available for import and use