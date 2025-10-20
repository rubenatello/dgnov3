/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import * as admin from 'firebase-admin';
import * as functionsV1 from 'firebase-functions';

admin.initializeApp();

// When an article document is published and has breakingRequested=true, set breakingUntil to server time + 3 hours
export const setBreakingUntilOnPublish = functionsV1.firestore
	.document('articles/{articleId}')
	.onUpdate(async (change, context) => {
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
