# DGNO Project TODO

## 🚨 CRITICAL - Security Reminders

- [ ] **URGENT: Update Firestore Security Rules by November 15, 2025**
  - Current: Test mode (anyone can read/write)
  - Action: Deploy production security rules (see spec)
  - Location: Firebase Console → Firestore Database → Rules

## 🔧 Immediate Setup Tasks

- [ ] Add Firebase configuration to `app/src/config/firebase.ts`
  - Get config from Firebase Console → Project Settings
  - Replace placeholder values in firebase.ts

## 📝 Development Priorities

### Phase 1: Core Features (Current)
- [ ] Create article editor page with Tiptap
- [ ] Implement user authentication (login/signup)
- [ ] Build article list page
- [ ] Build article detail/reader page
- [ ] Add image upload functionality
- [ ] Create author profiles

### Phase 2: Engagement Features
- [ ] Comment system with moderation
- [ ] Reactions (likes) on articles
- [ ] Bookmark functionality
- [ ] User profiles

### Phase 3: Monetization
- [ ] Stripe checkout integration
- [ ] Donation tracking in Firestore
- [ ] 30-day donation prompt logic
- [ ] Donor management dashboard

### Phase 4: AI Integration (DGNO)
- [ ] DGNO Cloud Function (LLM integration)
- [ ] Source allowlist system
- [ ] Cache DGNO results in Firestore
- [ ] Display DGNO analysis on articles

### Phase 5: Admin & Moderation
- [ ] Admin dashboard (desktop-only)
- [ ] User role management (reader, writer, editor, admin)
- [ ] Comment moderation interface
- [ ] Analytics dashboard

### Phase 6: Polish & Launch
- [ ] Mobile responsiveness testing
- [ ] Performance optimization
- [ ] SEO setup (meta tags, sitemap)
- [ ] Custom domain configuration
- [ ] Email notification setup
- [ ] Error tracking (Sentry or similar)
- [ ] Privacy policy & terms of service pages

## 🐛 Known Issues

- [ ] TypeScript linting warnings in models.ts (using `any` type)
- [ ] CSS linting warnings for Tailwind directives (can be ignored)

## 💡 Ideas / Future Enhancements

- [ ] Newsletter integration
- [ ] RSS feed
- [ ] Dark mode toggle
- [ ] Social media sharing
- [ ] Related articles suggestions
- [ ] Article series/collections
- [ ] Author following
- [ ] Push notifications
- [ ] Progressive Web App (PWA)
- [ ] Multi-language support

## 📚 Documentation Needed

- [ ] Writer's guide (how to use the editor)
- [ ] Admin manual
- [ ] API documentation for Cloud Functions
- [ ] Deployment guide
- [ ] Content guidelines

## 🎯 Milestones

- [x] **M1**: Project bootstrapped, theme & editor saving to Firestore (DONE)
- [ ] **M2**: Public article view + comments/likes/bookmarks (2-4 days)
- [ ] **M3**: Stripe donations + 30-day prompt (2-3 days)
- [ ] **M4**: DGNO function + cache + display (3-5 days)
- [ ] **M5**: Moderation, roles, polish, analytics (2-3 days)

---

**Last Updated**: October 17, 2025
**Current Sprint**: M1 Complete, Starting M2
