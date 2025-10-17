# Creating Your First User - Quick Guide

## Option 1: Use Firebase Console (Easiest for Testing)

### Step 1: Create Auth User
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `dgno-675a8`
3. Click **Authentication** in left sidebar
4. Click **Users** tab
5. Click **Add User** button
6. Enter:
   - **Email:** your-email@example.com
   - **Password:** your-password
7. Click **Add User**
8. **Copy the User UID** (you'll need it next)

### Step 2: Create Firestore User Document
1. In Firebase Console, click **Firestore Database**
2. Click **Start collection**
3. Collection ID: `users`
4. Click **Next**
5. Document ID: **Paste the User UID from Step 1**
6. Add fields:

| Field | Type | Value (Example) |
|-------|------|-----------------|
| `email` | string | your-email@example.com |
| `displayName` | string | John Doe |
| `roles` | array | `['writer', 'editor']` |
| `isStaff` | boolean | `true` |
| `isActive` | boolean | `true` |
| `createdAt` | timestamp | (click "Use server timestamp") |
| `bio` | string | (optional) Staff writer |
| `avatarUrl` | string | (optional) https://... |

7. Click **Save**

### Step 3: Test Login!
1. Go to http://localhost:5173
2. Click **Login** in top bar
3. Enter your email and password
4. You should see the dashboard WITH the sidebar! 🎉

---

## Option 2: Create Signup Page (Recommended for Production)

I can help you build a signup page that:
- Collects email, password, and display name
- Creates both Auth user and Firestore document automatically
- Defaults new users to `'reader'` role
- Admins can later upgrade users to staff roles

Let me know if you want me to build this!

---

## Option 3: Cloud Function (Advanced)

Create a Firebase Cloud Function that automatically creates a Firestore user document when someone signs up through Firebase Auth.

---

## Quick Test User Examples

### Regular Reader (No Sidebar)
```
roles: ['reader']
isStaff: false
isActive: true
```

### Writer (Has Sidebar)
```
roles: ['writer']
isStaff: true
isActive: true
```

### Editor (Has Sidebar)
```
roles: ['editor', 'writer']
isStaff: true
isActive: true
```

### Admin/Superuser (Has Sidebar + Full Access)
```
roles: ['superuser', 'admin', 'editor', 'writer']
isStaff: true
isActive: true
```

---

## What You'll See After Login

### As a Reader (no sidebar):
- Clean dashboard
- Welcome message
- Your role displayed
- Links to profile settings and bookmarks

### As Staff (with sidebar):
- Full dashboard with collapsible sidebar
- Quick stats (draft articles, published count)
- Navigation to:
  - Create Article
  - Manage Articles  
  - Media Library
  - Analytics
  - Settings
- Quick action cards

---

## Troubleshooting

**"Failed to sign in"**
- Check email/password are correct
- Make sure user exists in Firebase Auth

**Can't see sidebar**
- Check `isStaff: true` in Firestore user document
- Verify roles array includes at least one of: `['writer', 'editor', 'admin', 'dev', 'superuser']`

**"Access Denied" message**
- User document might not exist in Firestore
- Check that User UID matches between Auth and Firestore

---

**Ready to test?** Create your first user in Firebase Console and try logging in! 🚀
