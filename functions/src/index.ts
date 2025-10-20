
import * as functions from 'firebase-functions/v1';


import * as admin from 'firebase-admin';

admin.initializeApp();

// When an article document is published and has breakingRequested=true, set breakingUntil to server time + 3 hours
export const setBreakingUntilOnPublish = functions.runWith({ maxInstances: 10 }).firestore
  .document('articles/{articleId}')
  .onUpdate(async (change: any, context: any) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!after) return;
    const statusBefore = before?.status;
    const statusAfter = after?.status;

    const breakingRequestedBefore = !!before?.breakingRequested;
    const breakingRequestedAfter = !!after?.breakingRequested;

    // Trigger when article becomes published OR breakingRequested flag is set while published
    const justPublished = statusBefore !== 'published' && statusAfter === 'published';
    const publishedAndRequested = statusAfter === 'published' && breakingRequestedAfter && !breakingRequestedBefore;

    if (!(justPublished || publishedAndRequested)) return;

    const articleRef = change.after.ref;

    // Compute server time and add 3 hours
    const now = admin.firestore.Timestamp.now();
    const until = admin.firestore.Timestamp.fromMillis(now.toMillis() + 3 * 60 * 60 * 1000);

    try {
      await articleRef.update({
        breakingUntil: until,
        breakingRequested: false
      });
      console.log(`Set breakingUntil for article ${context.params.articleId} until ${until.toDate().toISOString()}`);
    } catch (err) {
      console.error('Failed to set breakingUntil:', err);
    }
  });
