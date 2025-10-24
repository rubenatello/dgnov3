Functions usage and env vars

This folder contains Cloud Functions for automated tasks (e.g., sending newsletters).

Env vars required (set via `firebase functions:config:set` or environment):
- SENDGRID_API_KEY - your SendGrid API key (optional; if missing, sends are skipped)
- NOREPLY_EMAIL - email address used as sender (default: news@yourdomain.com)

To deploy functions:

1. Install dependencies (inside functions folder):

   cd functions
   npm install

2. Build (if TypeScript):

   npm run build

3. Deploy:

   firebase deploy --only functions

Notes
- The code will no-op if SENDGRID_API_KEY isn't set to avoid sending in dev.
- For production mailing to many subscribers, use SendGrid Marketing lists or a queued worker to avoid hitting send limits.
