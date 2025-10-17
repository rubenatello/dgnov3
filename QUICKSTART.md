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
