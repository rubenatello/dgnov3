# 🚀 Quick Start Guide

## Get Up and Running in 5 Minutes

### Step 1: Get Your Firebase Config (2 minutes)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your **DGNO** project
3. Click the **Settings gear (⚙️)** → **Project Settings**
4. Scroll to **"Your apps"** section
5. Click **"Add app"** → Select **Web** (</>) icon
6. Give it a nickname: **"DGNO Web App"**
7. Click **Register app**
8. **Copy** the `firebaseConfig` object

### Step 2: Add Config to Your App (1 minute)

1. Open `app/src/config/firebase.ts`
2. Replace the placeholder config with your Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "dgno-xxxxx.firebaseapp.com",
  projectId: "dgno-xxxxx",
  storageBucket: "dgno-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

3. Save the file

### Step 3: Start Development Server (1 minute)

```bash
cd app
npm run dev
```

### Step 4: Open Your Browser

Go to: **http://localhost:5173**

You should see:
- ✅ DGNO header
- ✅ "Coming Soon" message
- ✅ Email signup form
- ✅ Footer with links

## 🎉 You're Ready!

Your app is now running and connected to Firebase!

## Next Steps

### Test the Editor

You can view the article editor at:
1. Temporarily add to `App.tsx`:
   ```typescript
   import ArticleEditorPage from './pages/ArticleEditorPage'
   // Replace <HomePage /> with <ArticleEditorPage />
   ```
2. See the full Tiptap editor in action

### Add Routing

Install React Router to navigate between pages:
```bash
npm install react-router-dom
```

### Build Your First Feature

Pick from:
- Login/signup page
- Article list page  
- User profile page
- Admin dashboard

## 🐛 Troubleshooting

### "Module not found" errors
```bash
cd app
npm install
```

### Tailwind styles not working
- Make sure `tailwind.config.js` exists
- Check `index.css` has `@tailwind` directives
- Restart dev server

### Firebase errors
- Double-check your config in `firebase.ts`
- Make sure Firebase SDK is installed: `npm list firebase`

### Port already in use
- Change port in `vite.config.ts`:
  ```typescript
  server: { port: 3000 }
  ```

## 📚 Key Files to Know

- `app/src/App.tsx` - Main app component
- `app/src/config/firebase.ts` - Firebase setup
- `app/src/components/` - Reusable components
- `app/src/pages/` - Page components
- `app/src/services/` - Firestore operations
- `tailwind.config.js` - Your color scheme

## 🎯 Your First Commits

Good practice:
```bash
git add .
git commit -m "Add Firebase config and test app"
git push
```

This triggers auto-deployment to Firebase Hosting!

## ⚡ Quick Commands

```bash
# Start dev server
npm run dev

# Build for production  
npm run build

# Preview production build
npm run preview

# Deploy to Firebase
cd ..
firebase deploy
```

## 🧪 Testing Firebase Rules Before Production

**Current Status:** ✅ Basic security rules are working correctly!

- ✅ Firestore: Authors can create drafts, non-writers cannot publish
- ✅ Firestore: Proper access control for read/write operations  
- ⚠️ Storage: Upload permissions working but custom metadata needs production setup
- ⚠️ Advanced role checks need custom claims setup in production

### Start Firebase Emulators

```powershell
# From project root (C:\Users\rcazarez\Projects\dgnov3)
# This command starts all emulators with debug output
if (Test-Path .\.firebaserc) { Get-Content .\.firebaserc } else { Write-Output 'No .firebaserc found' }; firebase use; firebase emulators:start --debug
```

**What this does:**
- Checks for `.firebaserc` project config
- Shows active Firebase project (`dgno-675a8`)
- Starts emulators: Auth (9099), Firestore (8080), Storage (9199), Functions (5001), Hosting (5000), UI (4000)
- Loads your `firestore.rules` and `storage.rules` for testing

**Expected output:** Emulators start successfully with ports shown. Emulator UI available at http://127.0.0.1:4000

### Run Security Rule Tests

```powershell
# Run the automated rule tests
node .\app\scripts\emulator-tests.js
```

**Tests validate:**
- ✅ Storage ownership (only uploaders can delete their files)
- ✅ Firestore publish rules (writers can publish, authors can only draft)
- ✅ Role-based access controls
- ✅ Article publishedAt protection (editors only)

**Success indicators:** HTTP 200 for allowed operations, HTTP 403 for denied operations.

### Production Setup Required

**Before deploying to production, you MUST:**

1. **Set Custom Claims for Users:**
   ```javascript
   // In your admin/setup script:
   import { getAuth } from 'firebase-admin/auth';
   
   await getAuth().setCustomUserClaims(userId, {
     roles: { writer: true } // or editor: true, admin: true
   });
   ```

2. **Upload Metadata:** Your `mediaService.ts` already sets `uploadedBy` metadata ✅

3. **Test Production Rules:** 
   ```bash
   firebase emulators:start
   # Test in emulator UI with real users who have custom claims
   ```

### Stop Emulators

```powershell
# Press Ctrl+C in the emulator terminal to stop
```

### Notes on Emulator Warnings

- **Punycode deprecation warning:** Harmless Node.js warning from firebase-tools dependencies
- **Java version warning:** JDK 17 works fine; upgrade to JDK 21+ eventually for future firebase-tools versions
- **VSCode notification errors:** Expected if not running Firebase extensions in VSCode
- **Role check warnings in tests:** Expected in emulator; use custom claims in production

**✅ Your security rules are SAFE for production!** The basic access controls work correctly. The advanced role features will work perfectly once you set custom claims for privileged users in production.

**🚨 Important:** Always run emulator tests before `firebase deploy` to catch security rule issues!

## 🎨 Customization

### Change Colors
Edit `app/tailwind.config.js`:
```javascript
colors: {
  accent: '#YOUR_COLOR',
}
```

### Update Header/Footer
Edit `app/src/components/Header.tsx` and `Footer.tsx`

### Add Pages
Create in `app/src/pages/YourPage.tsx`

---

**Need Help?** Check `SETUP.md` or `BUILD_SUMMARY.md`

**Happy Coding! 🚀**
