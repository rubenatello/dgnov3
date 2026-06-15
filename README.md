# DGNO v3

DGNO (Digital Government News Organization) is a Firebase-backed publishing platform for creating, managing, and reading news articles. It includes a public-facing site, an authenticated editorial dashboard, and Firebase security rules + Cloud Functions for backend workflows.

## Project Summary

- Public pages for home, article listing, and article detail
- Authenticated dashboard for writers/editors to create and manage content
- Rich-text authoring with Tiptap
- Media management with Firebase Storage
- Role-aware access control via Firebase Auth custom claims + Firestore/Storage rules
- Cloud Function automation for article publishing metadata

## Tech Stack

- Frontend: React 19, TypeScript, Vite, React Router, Tailwind CSS, Sass
- Editor: Tiptap
- Backend services: Firebase Authentication, Firestore, Cloud Storage
- Serverless backend: Firebase Cloud Functions (TypeScript, Node.js runtime)
- Tooling: ESLint, TypeScript compiler, npm workspaces-by-directory pattern (`/`, `app/`, `functions/`)

## Deployment Stack

- Hosting: Firebase Hosting
- API/backend logic: Firebase Cloud Functions
- Database: Cloud Firestore
- File storage: Firebase Storage
- Access control: Firestore rules + Storage rules + Firebase Auth claims
- Local testing/runtime: Firebase Emulator Suite
- CI/CD support: GitHub Actions workflows (repository-configured)

## Repository Layout

- `app/`: React frontend application
- `functions/`: Firebase Cloud Functions source
- `firestore.rules`: Firestore authorization rules
- `storage.rules`: Storage authorization rules
- `scripts/`: helper scripts for setup/role management
- `docs/`: additional documentation

## Quick Start

1. Install dependencies:
   - `npm ci`
   - `cd app && npm ci`
   - `cd ../functions && npm ci`
2. Run frontend locally:
   - `cd app && npm run dev`
3. Build frontend:
   - `cd app && npm run build`
4. Build functions:
   - `cd functions && npm run build`
5. Run emulator tests (requires emulators running):
   - `firebase emulators:start`
   - `npm run test-rules`

## Security Notes

- Client Firebase config values are public identifiers; secrets must stay in backend config/secrets.
- Firestore/Storage rules are part of the security boundary and must be kept in sync with role model changes.
- Rendered article HTML is sanitized before display to reduce XSS risk.

For additional setup and security guidance, see `SETUP.md`, `QUICKSTART.md`, and `SECURITY.md`.
