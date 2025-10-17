# 🔒 Firebase Security Guide

## Firebase Config Keys - PUBLIC vs PRIVATE

### ✅ SAFE to Expose (Already in Your Code)

These are **NOT secrets** and are meant to be public in your client-side code:

```javascript
{
  apiKey: "AIza...",           // ✅ Public - identifies your project
  authDomain: "...",            // ✅ Public - for auth redirects
  projectId: "...",             // ✅ Public - project identifier
  storageBucket: "...",         // ✅ Public - access via rules
  messagingSenderId: "...",     // ✅ Public - for cloud messaging
  appId: "..."                  // ✅ Public - app identifier
}
```

**These will be in your deployed JavaScript bundle and that's normal!**

### 🛡️ What Actually Secures Your App

Your real security comes from:

1. **Firestore Security Rules** (`firestore.rules`)
2. **Storage Security Rules** (`storage.rules`)
3. **Firebase Authentication** (who can sign in)
4. **Custom Claims** (user roles: reader, writer, editor, admin)

### ❌ NEVER Expose These (Backend Only)

Keep these **ONLY** in Cloud Functions or server environments:

- 🔴 **Service Account JSON files** (Firebase Admin SDK)
- 🔴 **Stripe Secret Keys** (`sk_live_...`, `sk_test_...`)
- 🔴 **OpenAI/LLM API Keys**
- 🔴 **Database connection strings** (if using external DBs)
- 🔴 **Webhook secrets**

**Store these in:**
- Cloud Functions environment variables: `firebase functions:config:set`
- GitHub Secrets (for CI/CD)
- Never commit to git!

## 🚨 Current Security Status

### Test Mode (EXPIRES Nov 15, 2025)

**Right now, your Firestore allows:**
- ❌ Anyone can read all data
- ❌ Anyone can write/modify/delete data
- ❌ No authentication required

**You MUST deploy production rules before November 15, 2025!**

## 📋 Security Deployment Checklist

### Before Going Live

- [ ] Deploy Firestore security rules
- [ ] Deploy Storage security rules
- [ ] Set up user roles (custom claims)
- [ ] Test rules with Firebase Emulator
- [ ] Review all access patterns
- [ ] Enable App Check (optional but recommended)

### Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy both
firebase deploy --only firestore:rules,storage:rules
```

### Test Your Rules

```bash
# Start Firebase Emulator
firebase emulators:start

# Test in browser
http://localhost:4000
```

## 🔑 Setting Up User Roles

User roles are set via **Custom Claims** in Firebase Auth:

### In Cloud Functions

```typescript
import * as admin from 'firebase-admin';

// Set user role
await admin.auth().setCustomUserClaims(userId, { 
  role: 'writer' // or 'editor', 'admin', 'reader'
});
```

### Available Roles

- **reader** - Can read published articles, comment, like, bookmark
- **writer** - Can create/edit their own articles
- **editor** - Can edit/publish any article, moderate comments
- **admin** - Full access to everything

## 🛡️ Security Rules Explained

### Firestore Rules (`firestore.rules`)

I've created production-ready rules that:

- ✅ Public can read published articles
- ✅ Writers can create/edit their own articles
- ✅ Editors can moderate everything
- ✅ Users can only access their own bookmarks
- ✅ Comments require approval
- ✅ Donations are write-protected (webhook only)

### Storage Rules (`storage.rules`)

- ✅ Anyone can read files
- ✅ Only writers can upload (with size limits)
- ✅ Images max 10MB
- ✅ Videos max 100MB
- ✅ Type validation (images must be image/*, videos must be video/*)

## 🔐 Environment Variables

### For Cloud Functions

```bash
# Set Stripe keys
firebase functions:config:set stripe.secret="sk_test_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."

# Set OpenAI key (for DGNO)
firebase functions:config:set openai.key="sk-..."

# View config
firebase functions:config:get
```

### For React App (Client-Side)

**Use `.env` files (already in .gitignore):**

```bash
# .env (NOT committed to git)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Access in code:
```typescript
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
```

## 🎯 Best Practices

### DO ✅

- ✅ Use Firebase Security Rules as your primary defense
- ✅ Validate data on the backend (Cloud Functions)
- ✅ Use custom claims for role-based access
- ✅ Keep service account keys in Cloud Functions only
- ✅ Use environment variables for secrets
- ✅ Test rules with emulator before deploying
- ✅ Add `.env` to `.gitignore`

### DON'T ❌

- ❌ Trust client-side validation alone
- ❌ Commit service account JSON to git
- ❌ Put secret keys in client code
- ❌ Rely on security through obscurity
- ❌ Leave test mode on in production
- ❌ Share API keys publicly (except Firebase config)

## 📅 Security Timeline

| Date | Action |
|------|--------|
| **Oct 17, 2025** | Project created (test mode) |
| **Before Nov 15** | Deploy production security rules |
| **Before Launch** | Security audit, penetration testing |
| **Post-Launch** | Regular security reviews |

## 🆘 If You Accidentally Expose Secrets

### Service Account Key Exposed

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new key
3. Delete old key
4. Update Cloud Functions

### Stripe Key Exposed

1. Go to Stripe Dashboard → Developers → API Keys
2. Roll (regenerate) the key
3. Update in Firebase Functions config

### Other API Keys

1. Regenerate in the service dashboard
2. Update environment variables
3. Redeploy functions

## 📚 Resources

- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [Firebase Auth Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Cloud Functions Environment Config](https://firebase.google.com/docs/functions/config-env)
- [Firebase App Check](https://firebase.google.com/docs/app-check)

## ✅ Summary

**Your current firebase.ts is SAFE!** ✅

Those keys are meant to be public. Your real security comes from:
1. Firestore rules (deploy before Nov 15!)
2. Storage rules (deploy before Nov 15!)
3. Firebase Auth + custom claims
4. Keeping backend secrets in Cloud Functions

**Next Steps:**
1. Test your app (it should work now!)
2. Set a reminder for November 15, 2025
3. When ready, deploy security rules with `firebase deploy --only firestore:rules,storage:rules`
