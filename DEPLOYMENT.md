# DGNO Deployment Guide

## Project Structure
- **Frontend**: Located in `/app` directory (React + Vite)
- **Backend**: Firebase Functions in `/functions` directory
- **Build Output**: Frontend builds to `/app/dist` directory
- **Deploy Config**: Firebase Hosting serves from `app/dist` (configured in `firebase.json`)

## Requirements
- **Node.js**: v18 or higher
- **npm**: v8 or higher  
- **Firebase CLI**: Install globally with `npm install -g firebase-tools`

## Build Process
1. **Frontend Build**: Run `npm run build` in `/app` directory
   - Source: `/app/src/` (React/TypeScript files)
   - Output: `/app/dist/` (production build)
   - Entry: `/app/index.html` → `/app/dist/index.html`

2. **Functions Build**: Runs automatically during deploy
   - Source: `/functions/src/` (TypeScript)
   - Output: `/functions/lib/` (compiled JavaScript)

## Deployment Methods

### Manual Deployment
```bash
# From project root
npm run deploy-all
# Or individual services:
npm run deploy-hosting
npm run deploy-functions
npm run deploy-rules
```

### Automatic CI/CD (GitHub Actions)
- **Trigger**: Push to `main` branch
- **Workflow**: `.github/workflows/firebase-deploy.yml`
- **Requirements**: 
  - `FIREBASE_TOKEN` secret set in GitHub repo settings
  - Get token with: `npx firebase-tools login:ci`

## Important Files
- `/firebase.json` - Firebase configuration
- `/app/dist/` - Frontend production build (DO NOT commit)
- `/functions/lib/` - Functions build output (DO NOT commit)
- `/.env.production` - Production environment variables (DO NOT commit)

## Common Issues
1. **Build folder mismatch**: Ensure `firebase.json` points to `app/dist`
2. **Missing build**: Run `npm run build` in `/app` before deploy
3. **Permission errors**: Check Firestore rules allow public read for published articles
4. **Function errors**: Check Functions logs in Firebase console

## Security Rules
- **Firestore**: Public read for published articles, authenticated write
- **Storage**: Public read for images, authenticated upload with metadata
- **Functions**: Service account permissions for admin operations

## Environment Setup
1. Install dependencies: `npm install` (root) + `npm install` (app)
2. Configure Firebase: `firebase init` (if not done)
3. Set environment variables in `.env.production`
4. Test with emulators: `npm run emulators`
5. Deploy: `npm run deploy-all`