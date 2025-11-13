
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

// Optional: SendGrid integration for newsletter emails
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sendgridMail: any = null;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
if (SENDGRID_API_KEY) {
  try {
    // require at runtime to avoid install-time errors if env not present
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sendgridMail = require("@sendgrid/mail");
    sendgridMail.setApiKey(SENDGRID_API_KEY);
    console.log("SendGrid mail initialized");
  } catch (e) {
    console.warn("SendGrid package not available or failed to initialize:", e);
    sendgridMail = null;
  }
}

/**
 * Split an array into smaller chunks of specified size.
 * @param {Array<T>} arr - The array to chunk
 * @param {number} size - The size of each chunk
 * @return {Array<Array<T>>} Array of chunks
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

// When an article document is published and has breakingRequested=true,
// set breakingUntil to server time + 3 hours
export const setBreakingUntilOnPublish = functions
  .runWith({maxInstances: 10})
  .firestore
  .document("articles/{articleId}")
  .onUpdate(async (
    change: functions.Change<functions.firestore.DocumentSnapshot>,
    context: functions.EventContext
  ) => {
    const after = change.after.data();

    if (!after) return;
    const statusAfter = after?.status;

    // removed unused breakingRequestedBefore
    const breakingRequestedAfter = !!after?.breakingRequested;

    // Only set breakingUntil if article is published AND breakingRequested
    // removed unused justPublished
    if (statusAfter === "published" && breakingRequestedAfter === true) {
      const articleRef = change.after.ref;
      // Compute server time and add 3 hours
      const now = admin.firestore.Timestamp.now();
      const threeHours = 3 * 60 * 60 * 1000;
      const until = admin.firestore.Timestamp.fromMillis(
        now.toMillis() + threeHours
      );
      try {
        await articleRef.update({
          breakingUntil: until,
          breakingRequested: false,
        });
        const msg = "Set breakingUntil for article " +
          `${context.params.articleId} until ${until.toDate().toISOString()}`;
        console.log(msg);
      } catch (err) {
        console.error("Failed to set breakingUntil:", err);
      }
    }
  });

/**
 * Send a newsletter email to subscribed users when an article is published.
 * Uses SendGrid if SENDGRID_API_KEY is configured. For large lists you should
 * migrate to using SendGrid Marketing lists or a queued job.
 */
export const onArticlePublish = functions
  .runWith({memory: "1GB", timeoutSeconds: 120})
  .firestore
  .document("articles/{articleId}")
  .onCreate(async (snap: functions.firestore.DocumentSnapshot) => {
    const article = snap.data();
    if (!article) return;
    if (article.status !== "published") {
      console.log(
        "Article created but not published; skipping newsletter send."
      );
      return;
    }

    if (!sendgridMail) {
      console.log("SENDGRID_API_KEY not configured; skipping newsletter send.");
      return;
    }

    try {
      const subsRef = admin
        .firestore()
        .collection("subscribers")
        .where("subscribed", "==", true)
        .where("email", "!=", null);
      const subsSnap = await subsRef.get();
      const emails: string[] = subsSnap.docs
        .map((d) => (d.data().email || "").toString())
        .filter(Boolean);
      if (!emails.length) {
        console.log("No subscribed emails to send to.");
        return;
      }

      // Build message payloads in batches (safe batch size 100)
      const batches = chunkArray(emails, 100);
      const articleUrl = article.url ||
        (article.slug ?
          `https://yourdomain.com/articles/${article.slug}` : "");
      const subject = `New article: ${article.title || "Latest from DGNO"}`;
      for (const batch of batches) {
        const msgs = batch.map((to) => ({
          to,
          from: process.env.NOREPLY_EMAIL || "news@yourdomain.com",
          subject,
          html: `<h2>${article.title}</h2><p>${article.summary || ""}</p>` +
            `<p><a href="${articleUrl}">Read more</a></p>`,
        }));
        try {
          // send array of messages
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (sendgridMail as any).send(msgs);
          console.log(`Sent batch of ${msgs.length} newsletter emails`);
        } catch (sendErr) {
          console.error("Failed to send newsletter batch", sendErr);
        }
      }
    } catch (err) {
      console.error("onArticlePublish error", err);
    }
  });

// When a subscriber doc is created, write a welcome/in-app notification
// to their user notifications
export const onSubscriberCreateNotification = functions
  .runWith({memory: "256MB"})
  .firestore
  .document("subscribers/{uid}")
  .onCreate(async (
    snap: functions.firestore.DocumentSnapshot,
    ctx: functions.EventContext
  ) => {
    const data = snap.data();
    if (!data) return;
    const uid = ctx.params.uid;
    try {
      const notifRef = admin
        .firestore()
        .collection("users")
        .doc(uid)
        .collection("notifications")
        .doc();
      await notifRef.set({
        title: "Thanks for subscribing!",
        body: "Thanks for subscribing — we're crowdfunding a newsletter " +
          "feature. Please consider donating to help us launch email " +
          "delivery. You can still like, comment and bookmark articles.",
        createdAt: admin.firestore.Timestamp.now(),
        read: false,
        type: "welcome",
      });
      console.log(`Welcome notification created for ${uid}`);
    } catch (err) {
      console.error("Failed to write welcome notification", err);
    }
  });

// Maintain a lightweight subscriber counter at `stats/subscribers`.
// Increments on create and decrements on delete to provide a fast read path
// for UI components that display progress toward subscriber goals.
export const incrementSubscriberCount = functions
  .runWith({memory: "256MB"})
  .firestore
  .document("subscribers/{uid}")
  .onCreate(async (
    snap: functions.firestore.DocumentSnapshot,
    ctx: functions.EventContext
  ) => {
    try {
      const statsRef = admin.firestore().doc("stats/subscribers");
      await statsRef.set(
        {count: admin.firestore.FieldValue.increment(1)},
        {merge: true}
      );
      console.log("Incremented subscriber count for", ctx.params.uid);
    } catch (err) {
      console.error("Failed to increment subscriber count", err);
    }
  });

export const decrementSubscriberCount = functions
  .runWith({memory: "256MB"})
  .firestore
  .document("subscribers/{uid}")
  .onDelete(async (
    snap: functions.firestore.DocumentSnapshot,
    ctx: functions.EventContext
  ) => {
    try {
      const statsRef = admin.firestore().doc("stats/subscribers");
      // decrement by 1; if you need non-negative enforcement, consider
      // a transaction
      await statsRef.set(
        {count: admin.firestore.FieldValue.increment(-1)},
        {merge: true}
      );
      console.log("Decremented subscriber count for", ctx.params.uid);
    } catch (err) {
      console.error("Failed to decrement subscriber count", err);
    }
  });

/**
 * BLS API Proxy Function
 * Proxies requests to the Bureau of Labor Statistics API to avoid CORS issues
 * in the frontend. Accepts the same payload as the BLS API v2.0.
 */
export const blsProxy = functions
  .runWith({
    memory: "256MB",
    timeoutSeconds: 30,
  })
  .https
  .onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      res.status(200).send();
      return;
    }

    // Only allow POST requests (BLS API requirement for multiple series)
    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed. Use POST."});
      return;
    }

    try {
      console.log("Proxying BLS API request:", req.body);

      const blsResponse = await fetch(
        "https://api.bls.gov/publicAPI/v2/timeseries/data/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req.body),
        }
      );

      if (!blsResponse.ok) {
        throw new Error(`BLS API returned ${blsResponse.status}: ${blsResponse.statusText}`);
      }

      const data = await blsResponse.json();
      console.log("BLS API response status:", data.status);

      res.json(data);
    } catch (error) {
      console.error("BLS Proxy Error:", error);
      res.status(500).json({
        error: "Failed to fetch data from BLS API",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

// Note: Contact sync to SendGrid Marketing API is intentionally omitted here
// to avoid requiring the @sendgrid/client dependency. For production-grade
// mailing lists we recommend running a separate sync process (server-side)
// or using SendGrid's marketing lists via a secure backend endpoint.
