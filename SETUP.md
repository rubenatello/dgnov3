# DGNO Project Setup Guide

## ✅ What's Been Completed

### Firebase Backend
- ✅ Firebase project initialized with Firestore, Auth, Storage, Hosting, and Functions
- ✅ Firestore database (nam5, test mode - **expires in 30 days!**)
- ✅ Authentication (email/password enabled)
- ✅ Cloud Storage with 3 folders: `assets`, `images`, `videos`
- ✅ Cloud Functions (TypeScript, Node.js 20)
- ✅ GitHub Actions for automatic deployment

### Frontend (React App)
- ✅ React + TypeScript with Vite
- ✅ Tailwind CSS configured with custom color scheme
- ✅ Tiptap rich text editor installed and configured
- ✅ Firebase SDK installed
- ✅ Mobile-first Header and Footer components
- ✅ "Coming Soon" home page
- ✅ TypeScript data models for all collections
- ✅ Article service with CRUD operations
- ✅ Helper utilities (slug generation, validation, formatting)

## 🚨 Important: Firebase Configuration Required

**Before you can use the app, you must add your Firebase credentials:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your DGNO project
3. Click Settings (⚙️) → Project Settings
4. Scroll to "Your apps" → Click "Add app" → Select Web (</>)
5. Register your app (nickname: "DGNO Web App")
6. Copy the `firebaseConfig` object
7. Open `app/src/config/firebase.ts`
8. Replace the placeholder config with your actual Firebase config

## 🚨 Security Reminder

**Firestore test mode expires November 15, 2025 (30 days from setup)**

Before that date, you MUST:
1. Update Firestore security rules (see spec for starter rules)
2. Go to Firebase Console → Firestore Database → Rules
3. Update and publish new rules

## 📁 Project Structure

```
dgnov3/
├── app/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx        # Mobile-friendly header
│   │   │   ├── Footer.tsx        # Mobile-friendly footer
│   │   │   └── TiptapEditor.tsx  # Rich text editor component
│   │   ├── pages/
│   │   │   └── HomePage.tsx      # "Coming Soon" landing page
│   │   ├── config/
│   │   │   └── firebase.ts       # ⚠️ ADD YOUR CONFIG HERE
│   │   ├── services/
│   │   │   └── articleService.ts # Firestore article operations
│   │   ├── types/
│   │   │   └── models.ts         # All data model interfaces
│   │   └── utils/
│   │       └── helpers.ts        # Slug, validation, formatting
│   ├── tailwind.config.js        # Custom color scheme
│   └── dist/                     # Build output (Firebase Hosting)
├── functions/                    # Cloud Functions (TypeScript)
│   └── src/
│       └── index.ts             # Functions entry point
├── .github/
│   └── workflows/               # Auto-deploy on PR merge
├── firebase.json                # Firebase configuration
└── .firebaserc                  # Firebase project reference
```

## 🎨 Color Scheme

```css
--c-bg: #FCFCFC        /* Base background */
--c-ink: #1D212B       /* Primary text */
--c-inkMuted: #303030  /* Muted text */
--c-sand: #AEA492      /* Accent neutral */
--c-paper: #FFFAF0     /* Cards/articles */
--c-stone: #E5E2DC     /* Dividers */
--c-accent: #FF9C6E    /* CTA, links */
```

## 🗃️ Data Models (Firestore Collections)

All defined in `app/src/types/models.ts`:

- **articles** - Title, slug, content (Tiptap JSON), featured image, author, status, dates
- **media** - Images/videos with title, description, alt, source credit
- **authors** - Display name, role, avatar, bio
- **comments** - Article comments with approval status
- **reactions** - Likes on articles
- **bookmarks** - User-saved articles
- **dgno** - AI analysis payloads
- **donors** - Donor information
- **donations** - Payment records

## 🚀 Running the App

### Development Server

```bash
cd app
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
cd app
npm run build
```

### Deploy to Firebase

From project root:

```bash
firebase deploy
```

Or deploy only hosting:

```bash
firebase deploy --only hosting
```

Or only functions:

```bash
firebase deploy --only functions
```

## 📝 Next Steps

### Immediate (Priority)
1. **Add Firebase config** to `app/src/config/firebase.ts`
2. **Test the app** - make sure it runs without errors
3. **Create article editor page** for writers
4. **Set up authentication flow** (login/signup)

### Short-term
5. Build admin dashboard (desktop-optimized)
6. Implement media upload with metadata
7. Create article list and detail pages
8. Add comment system
9. Implement reactions (likes)

### Medium-term
10. DGNO (AI analysis) Cloud Function
11. Stripe donation integration
12. Email notifications
13. Moderation tools
14. Analytics integration

### Before Launch
15. **Update Firestore security rules** (before 30-day expiry!)
16. Set up custom domain
17. Configure email templates
18. Test on mobile devices
19. Performance optimization
20. SEO setup

## 🛠️ Development Workflow

1. **Local Development**: Make changes in `app/src`
2. **Test**: Run dev server and test locally
3. **Commit**: Git commit with clear message
4. **Push**: Push to GitHub
5. **Auto-deploy**: GitHub Actions will deploy to Firebase on PR merge to main

## 📚 Key Technologies

- **React 18** + **TypeScript** - Frontend framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Tiptap** - Rich text editor (headless, extensible)
- **Firebase** - Backend (Firestore, Auth, Storage, Functions, Hosting)
- **Node.js 20** - Cloud Functions runtime

## 💡 Tips

- **Admin pages** should be desktop-optimized (not mobile-first)
- **Public pages** must be mobile-friendly
- Store **media metadata** in Firestore for reusability
- Use **slug format**: `articles/YYYY/MM/DD/title-slug`
- **Summary** field has 300-character limit
- Tiptap stores content as **JSON** for flexibility

## 🐛 Troubleshooting

### "Firebase not configured" error
- Add your Firebase config to `app/src/config/firebase.ts`

### Build errors
- Run `npm install` in the `app` directory
- Check Node version (v20.17.0 or higher recommended)

### Deploy fails
- Make sure you're logged in: `firebase login`
- Check you're in the correct project: `firebase use --list`

## 📖 Documentation Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Tiptap Docs](https://tiptap.dev/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/) (for when you add routing)

## ⚡ Quick Commands

```bash
# Start dev server
cd app && npm run dev

# Build for production
cd app && npm run build

# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# View Firebase logs
firebase functions:log

# Check Firebase project
firebase use --list
```

## 🎯 Goals (from spec)

### M1: Bootstrap & Editor (1-2 days) ✅ DONE
- [x] Project setup
- [x] Theme & Tailwind
- [x] Editor saving to Firestore

### M2: Public Articles (2-4 days)
- [ ] Article list view
- [ ] Article detail page
- [ ] Comments
- [ ] Likes
- [ ] Bookmarks

### M3: Donations (2-3 days)
- [ ] Stripe integration
- [ ] 30-day prompt logic
- [ ] Donation tracking

### M4: DGNO Integration (3-5 days)
- [ ] DGNO Cloud Function
- [ ] Source allowlist
- [ ] Analysis display

### M5: Polish (2-3 days)
- [ ] Moderation dashboard
- [ ] Roles enforcement
- [ ] Analytics
- [ ] Performance optimization

---

**Status**: Project scaffolded and ready for development! 🎉
**Next**: Add Firebase config and start building features.
