#!/usr/bin/env node

// scripts/setup-user-roles.js
// Run this script to set up user roles in production
// Usage: node scripts/setup-user-roles.js <email> <role>
// Example: node scripts/setup-user-roles.js admin@dgno.us admin

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // In production, this uses your service account key
  // Set GOOGLE_APPLICATION_CREDENTIALS environment variable to point to your service account key file
  admin.initializeApp({
    projectId: 'dgno-675a8' // Your project ID
  });
}

async function setUserRole(email, role) {
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${userRecord.email} (${userRecord.uid})`);

    // Set custom claims
    const customClaims = {
      roles: { [role]: true }
    };

    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
    console.log(`✅ Successfully set role '${role}' for ${email}`);
    
    // Also update the user document in Firestore for fallback
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      displayName: userRecord.displayName || email.split('@')[0],
      rolesMap: { [role]: true },
      isStaff: ['writer', 'editor', 'admin', 'superuser'].includes(role),
      isActive: true,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✅ Also updated Firestore user document for fallback`);
    
  } catch (error) {
    console.error('❌ Error setting user role:', error);
  }
}

async function listUserRoles(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`User: ${userRecord.email}`);
    console.log(`Custom Claims:`, userRecord.customClaims);
    
    // Also check Firestore document
    const userDoc = await admin.firestore().collection('users').doc(userRecord.uid).get();
    if (userDoc.exists) {
      console.log(`Firestore rolesMap:`, userDoc.data()?.rolesMap);
    }
  } catch (error) {
    console.error('❌ Error getting user:', error);
  }
}

// Command line interface
const [,, email, role] = process.argv;

if (!email) {
  console.log('Usage: node scripts/setup-user-roles.js <email> [role]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/setup-user-roles.js admin@dgno.us admin');
  console.log('  node scripts/setup-user-roles.js writer@dgno.us writer');
  console.log('  node scripts/setup-user-roles.js rubencazpress@proton.me editor');
  console.log('  node scripts/setup-user-roles.js user@example.com  # Just list current roles');
  console.log('');
  console.log('Available roles: reader, writer, editor, admin, superuser');
  process.exit(1);
}

if (role) {
  setUserRole(email, role).then(() => process.exit(0));
} else {
  listUserRoles(email).then(() => process.exit(0));
}