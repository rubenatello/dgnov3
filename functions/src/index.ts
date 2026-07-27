
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import {createHash, randomUUID} from "crypto";
import {
  ContactValidationError,
  parseContactSubmission,
} from "./contact";
import {newsletterEmailEnabled} from "./email-policy";
import {
  SITE_URL,
  PublicArticle,
  PublicTracker,
  canonicalArticlePath,
  canonicalArticleUrl,
  normalizeArticleSlug,
  publicationDayRange,
  renderArchiveDocument,
  renderArticleDocument,
  renderAtomFeed,
  renderNewsSitemap,
  renderNotFoundDocument,
  renderRssFeed,
  renderSitemap,
  renderTrackerDocument,
  renderTrackerNotFoundDocument,
  significantUpdateDate,
  toDate,
} from "./seo";
import {
  composeSocialCard,
  controlledFeaturedImageUrl,
  fetchControlledImage,
} from "./social-image";

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
 * Generate a branded social derivative when a reporting image is published.
 * The original photograph remains the NewsArticle image; this JPEG is used
 * only by Open Graph and Twitter card metadata.
 */
export const generateArticleSocialImage = functions
  .runWith({memory: "1GB", timeoutSeconds: 120})
  .firestore
  .document("articles/{articleId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return;

    const article = change.after.data();
    if (!article || article.status !== "published") return;

    const featuredImageUrl = controlledFeaturedImageUrl(
      article.featuredImageUrl,
    );
    if (!featuredImageUrl) {
      console.log(
        "Skipping social image: featured image is not in controlled storage",
        context.params.articleId,
      );
      return;
    }

    if (
      article.socialImageUrl &&
      article.socialImageSourceUrl === featuredImageUrl
    ) {
      return;
    }

    try {
      const [featuredImage, logoImage] = await Promise.all([
        fetchControlledImage(featuredImageUrl),
        fetchControlledImage(`${SITE_URL}/logo.png`, true),
      ]);
      const socialCard = await composeSocialCard(featuredImage, logoImage);
      const bucket = admin.storage().bucket();
      const objectPath =
        `social-cards/articles/${context.params.articleId}.jpg`;
      const downloadToken = randomUUID();

      await bucket.file(objectPath).save(socialCard, {
        resumable: false,
        metadata: {
          contentType: "image/jpeg",
          cacheControl: "public,max-age=31536000,immutable",
          metadata: {firebaseStorageDownloadTokens: downloadToken},
        },
      });

      const socialImageUrl =
        `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
        `${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;

      await change.after.ref.set({
        socialImageUrl,
        socialImageSourceUrl: featuredImageUrl,
        socialImageUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
      console.log("Generated article social image", context.params.articleId);
    } catch (error) {
      console.error(
        "Failed to generate article social image",
        context.params.articleId,
        error,
      );
    }
  });

/**
 * Send a newsletter email to subscribed users when an article is published.
 * Delivery remains off unless DGNO_NEWSLETTER_EMAIL_ENABLED is explicitly
 * set to the exact value "true" in addition to a configured mail provider.
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

    if (!newsletterEmailEnabled(
      process.env.DGNO_NEWSLETTER_EMAIL_ENABLED,
    )) {
      console.log("Newsletter delivery is disabled; skipping email send.");
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

const CONTACT_DESTINATION = "rubencazpress@proton.me";
const CONTACT_LIMIT_PER_HOUR = 5;

function contactOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (origin === SITE_URL || origin === "https://www.dgno.us") return true;
  return /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin);
}

async function contactRateLimitAllowed(ipAddress: string): Promise<boolean> {
  const windowStart = Math.floor(Date.now() / 3_600_000);
  const identifier = createHash("sha256")
    .update(`${ipAddress}|${windowStart}`)
    .digest("hex");
  const rateRef = admin.firestore().collection("contactRateLimits")
    .doc(identifier);

  return admin.firestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(rateRef);
    const count = Number(snapshot.data()?.count || 0);
    if (count >= CONTACT_LIMIT_PER_HOUR) return false;

    transaction.set(rateRef, {
      count: count + 1,
      expiresAt: admin.firestore.Timestamp.fromMillis(
        (windowStart + 2) * 3_600_000,
      ),
    });
    return true;
  });
}

/** Deliver the public newsroom form without exposing the destination address. */
export const contact = functions
  .runWith({memory: "256MB", timeoutSeconds: 30})
  .https
  .onRequest(async (req, res) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");

    const origin = req.get("origin");
    if (!contactOriginAllowed(origin)) {
      res.status(403).json({error: "Origin is not allowed"});
      return;
    }
    if (origin) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Vary", "Origin");
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send();
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed. Use POST."});
      return;
    }
    if (!req.is("application/json")) {
      res.status(415).json({error: "Content-Type must be application/json"});
      return;
    }

    try {
      const submission = parseContactSubmission(req.body);
      if (submission.isHoneypot) {
        res.status(202).json({ok: true});
        return;
      }

      const fromEmail = process.env.CONTACT_FROM_EMAIL ||
        process.env.NOREPLY_EMAIL || "";
      if (!sendgridMail || !fromEmail) {
        console.error("Contact delivery is not configured");
        res.status(503).json({
          error: "Newsroom delivery is temporarily unavailable.",
        });
        return;
      }

      const forwarded = req.get("x-forwarded-for")?.split(",")[0]?.trim();
      const ipAddress = forwarded || req.ip || "unknown";
      if (!await contactRateLimitAllowed(ipAddress)) {
        res.status(429).json({
          error: "Too many messages. Please try again later.",
        });
        return;
      }

      const sourceLine = submission.sourceUrl ?
        `Page URL: ${submission.sourceUrl}\n` : "";
      await sendgridMail.send({
        to: CONTACT_DESTINATION,
        from: fromEmail,
        replyTo: {email: submission.email, name: submission.name},
        subject: `[DGNO ${submission.topic}] ${submission.name}`,
        text: [
          `Name: ${submission.name}`,
          `Reply email: ${submission.email}`,
          `Topic: ${submission.topic}`,
          sourceLine.trim(),
          "",
          submission.message,
        ].filter((line) => line !== "").join("\n"),
      });
      res.status(202).json({ok: true});
    } catch (error) {
      if (error instanceof ContactValidationError) {
        res.status(400).json({error: error.message});
        return;
      }
      console.error("Contact delivery failed", error);
      res.status(502).json({
        error: "The newsroom could not receive this message. Try again later.",
      });
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

const SECTION_PATHS = [
  "/articles/politics",
  "/articles/immigration",
  "/articles/legislation",
  "/articles/foreign-affairs",
  "/articles/economy",
  "/articles/white-house",
  "/articles/courts",
  "/articles/congress",
  "/articles/human-rights",
  "/articles/environment",
  "/articles/business",
  "/articles/tech",
  "/articles/finance",
  "/articles/trump-presidency",
  "/articles/data-analysis",
  "/articles/opinion",
  "/articles/fact-check",
  "/articles/health",
  "/articles/science",
  "/articles/sports",
];

const STATIC_PUBLIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/corrections",
  "/editorial-standards",
  "/funding",
  "/privacy",
  "/trackers",
  "/reports",
  "/investigations",
  "/investigations/epstein-files",
];

const LEGACY_ARTICLE_CACHE_TTL_MS = 5 * 60 * 1000;
const LEGACY_ARTICLE_CACHE_LIMIT = 500;
let legacyArticleCache: {
  expiresAt: number;
  articles: PublicArticle[];
} | null = null;
let legacyArticleCacheLoad: Promise<PublicArticle[]> | null = null;

async function getPublishedArticles(): Promise<PublicArticle[]> {
  const snapshot = await admin.firestore().collection("articles")
    .where("status", "==", "published")
    .get();

  return snapshot.docs
    .map((doc) => ({id: doc.id, ...doc.data()} as PublicArticle))
    .filter((article) => article.isActive !== false);
}

async function getActiveTrackers(): Promise<PublicTracker[]> {
  const snapshot = await admin.firestore().collection("trackers")
    .where("isActive", "==", true)
    .get();
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
  } as PublicTracker));
}

async function findActiveTracker(slug: string): Promise<PublicTracker | null> {
  const snapshot = await admin.firestore().collection("trackers")
    .where("slug", "==", slug)
    .limit(2)
    .get();
  const matches = snapshot.docs
    .map((doc) => ({id: doc.id, ...doc.data()} as PublicTracker & {id: string}))
    .filter((tracker) => tracker.isActive === true);
  return matches.length === 1 ? matches[0] : null;
}

function requestTrackerSlug(requestUrl: string): string | null {
  const pathname = new URL(requestUrl, SITE_URL).pathname;
  const match = pathname.match(/^\/tracker\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    const slug = decodeURIComponent(match[1]);
    return /^[a-z0-9-]{1,200}$/.test(slug) ? slug : null;
  } catch {
    return null;
  }
}

async function getLegacyArticleCache(): Promise<PublicArticle[]> {
  if (legacyArticleCache && legacyArticleCache.expiresAt > Date.now()) {
    return legacyArticleCache.articles;
  }
  if (legacyArticleCacheLoad) return legacyArticleCacheLoad;

  legacyArticleCacheLoad = admin.firestore().collection("articles")
    .where("status", "==", "published")
    .limit(LEGACY_ARTICLE_CACHE_LIMIT)
    .get()
    .then((snapshot) => snapshot.docs
      .map((doc) => ({id: doc.id, ...doc.data()} as PublicArticle))
      .filter((article) => article.isActive !== false))
    .then((articles) => {
      legacyArticleCache = {
        articles,
        expiresAt: Date.now() + LEGACY_ARTICLE_CACHE_TTL_MS,
      };
      return articles;
    })
    .finally(() => {
      legacyArticleCacheLoad = null;
    });

  return legacyArticleCacheLoad;
}

async function findPublishedArticle(
  requestedIdentifier: string,
): Promise<PublicArticle | null> {
  const normalized = normalizeArticleSlug(requestedIdentifier);
  if (!normalized) return null;

  const candidates = Array.from(new Set([
    requestedIdentifier.replace(/^\/+|\/+$/g, ""),
    normalized,
  ].filter(Boolean)));
  const collection = admin.firestore().collection("articles");

  for (const candidate of candidates) {
    const snapshot = await collection
      .where("slug", "==", candidate)
      .where("status", "==", "published")
      .limit(2)
      .get();
    const matches = snapshot.docs
      .map((doc) => ({id: doc.id, ...doc.data()} as PublicArticle))
      .filter((article) => article.isActive !== false);
    if (matches.length === 1) return matches[0];
  }

  // Legacy documents may store a YYYY/MM/DD prefix in the slug. A short-lived,
  // size-bounded cache avoids a collection scan for every random article 404.
  if (!/^[a-z0-9-]{1,200}$/i.test(normalized)) return null;
  const published = await getLegacyArticleCache();
  const matches = published.filter((article) =>
    normalizeArticleSlug(article.slug) === normalized);
  return matches.length === 1 ? matches[0] : null;
}

function requestArticleIdentifier(requestUrl: string): string | null {
  const pathname = new URL(requestUrl, SITE_URL).pathname;
  if (!pathname.startsWith("/article/")) return null;
  try {
    return decodeURIComponent(pathname.slice("/article/".length))
      .replace(/^\/+|\/+$/g, "");
  } catch {
    return null;
  }
}

function setXmlHeaders(
  res: functions.Response,
  contentType: string,
): void {
  res.set("Content-Type", `${contentType}; charset=utf-8`);
  res.set("Cache-Control", "public, max-age=300, s-maxage=900");
  res.set("X-Content-Type-Options", "nosniff");
}

const PUBLIC_ARTICLE_SUMMARY_FIELDS = [
  "title",
  "slug",
  "subtitle",
  "summary",
  "featuredImageUrl",
  "featuredImageDescription",
  "section",
  "tags",
  "authorId",
  "authorName",
  "coAuthorId",
  "coAuthorName",
  "publishedAt",
  "lastUpdatedAt",
  "breakingUntil",
  "viewCount",
  "likeCount",
  "commentCount",
  "wordCount",
  "isActive",
];

const PUBLIC_ARTICLE_SECTIONS = new Set([
  "Politics",
  "Immigration",
  "Legislation",
  "Foreign Affairs",
  "Economy",
  "White House",
  "Courts",
  "Congress",
  "Human Rights",
  "Environment",
  "Business",
  "Tech",
  "Finance",
  "Trump Presidency",
  "Data Analysis",
  "Opinion",
  "Fact-Check",
  "Health",
  "Science",
  "Sports",
]);

function publicArticleLimit(value: unknown): number | null {
  if (value === undefined) return 24;
  if (typeof value !== "string" || !/^\d{1,3}$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 && parsed <= 100 ? parsed : null;
}

function isoDate(value: unknown): string | null {
  return toDate(value)?.toISOString() || null;
}

function publicAuthorId(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(value)) return null;
  return value;
}

function publicArticleSection(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !PUBLIC_ARTICLE_SECTIONS.has(value)) {
    return null;
  }
  return value;
}

function publicArticleDay(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !publicationDayRange(value)) return null;
  return value;
}

/** Extract and validate an author ID from the public profile request path. */
function publicAuthorPathId(requestUrl: string): string | null {
  const pathname = new URL(requestUrl, SITE_URL).pathname;
  const match = pathname.match(/^\/api\/authors\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return publicAuthorId(decodeURIComponent(match[1])) || null;
  } catch {
    return null;
  }
}

/** Return an HTTP(S) profile URL or null without exposing other schemes. */
function safePublicProfileUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ?
      parsed.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Return bounded card/search records without transferring full article bodies.
 * This endpoint intentionally exposes only fields already visible publicly.
 */
export const publicArticles = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.set("Allow", "GET, HEAD");
    res.set("Cache-Control", "no-store");
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const requestedLimit = publicArticleLimit(req.query.limit);
  if (requestedLimit === null) {
    res.set("Cache-Control", "no-store");
    res.status(400).json({error: "limit must be an integer from 1 to 100"});
    return;
  }
  const requestedAuthorId = publicAuthorId(req.query.authorId);
  if (requestedAuthorId === null) {
    res.set("Cache-Control", "no-store");
    res.status(400).json({
      error: "authorId contains unsupported characters or is too long",
    });
    return;
  }
  const requestedSection = publicArticleSection(req.query.section);
  if (requestedSection === null) {
    res.set("Cache-Control", "no-store");
    res.status(400).json({error: "section is not a recognized DGNO section"});
    return;
  }
  const requestedDay = publicArticleDay(req.query.publishedOn);
  if (requestedDay === null) {
    res.set("Cache-Control", "no-store");
    res.status(400).json({error: "publishedOn must be a real YYYY-MM-DD date"});
    return;
  }
  const filterCount = [requestedAuthorId, requestedSection, requestedDay]
    .filter(Boolean).length;
  if (filterCount > 1) {
    res.set("Cache-Control", "no-store");
    res.status(400).json({
      error: "authorId, section, and publishedOn cannot be combined",
    });
    return;
  }

  try {
    const readLimit = Math.min(requestedLimit + 20, 120);
    let query = admin.firestore().collection("articles")
      .where("status", "==", "published");
    if (requestedAuthorId) {
      query = query.where("authorId", "==", requestedAuthorId);
    }
    if (requestedSection) {
      query = query.where("section", "==", requestedSection);
    }
    if (requestedDay) {
      const dayRange = publicationDayRange(requestedDay);
      if (!dayRange) throw new Error("Validated publication day became invalid");
      query = query
        .where("publishedAt", ">=", dayRange.start)
        .where("publishedAt", "<", dayRange.end);
    }
    const snapshot = await query
      .orderBy("publishedAt", "desc")
      .limit(readLimit)
      .select(...PUBLIC_ARTICLE_SUMMARY_FIELDS)
      .get();
    const articles = snapshot.docs
      .map((doc) => ({id: doc.id, ...doc.data()} as PublicArticle & {
        [key: string]: unknown;
      }))
      .filter((article) => article.isActive !== false)
      .slice(0, requestedLimit)
      .map((article) => ({
        id: article.id,
        title: article.title || "",
        slug: normalizeArticleSlug(article.slug),
        canonicalPath: canonicalArticlePath(article),
        subtitle: article.subtitle || null,
        summary: article.summary || null,
        featuredImageUrl: article.featuredImageUrl || null,
        featuredImageDescription: article.featuredImageDescription || null,
        section: article.section || null,
        tags: Array.isArray(article.tags) ? article.tags : [],
        authorId: typeof article.authorId === "string" ? article.authorId : null,
        authorName: article.authorName || null,
        coAuthorId: typeof article.coAuthorId === "string" ?
          article.coAuthorId : null,
        coAuthorName: typeof article.coAuthorName === "string" ?
          article.coAuthorName : null,
        publishedAt: isoDate(article.publishedAt),
        lastUpdatedAt: isoDate(article.lastUpdatedAt),
        breakingUntil: isoDate(article.breakingUntil),
        viewCount: typeof article.viewCount === "number" ?
          article.viewCount : 0,
        likeCount: typeof article.likeCount === "number" ? article.likeCount : 0,
        commentCount: typeof article.commentCount === "number" ?
          article.commentCount : 0,
        wordCount: typeof article.wordCount === "number" ? article.wordCount : null,
      }));

    res.set("Cache-Control", "public, max-age=60, s-maxage=300, " +
      "stale-while-revalidate=3600");
    res.set("Content-Type", "application/json; charset=utf-8");
    res.set("X-Content-Type-Options", "nosniff");
    res.status(200).json({
      articles,
      limit: requestedLimit,
      authorId: requestedAuthorId || null,
      section: requestedSection || null,
      publishedOn: requestedDay || null,
    });
  } catch (error) {
    console.error("Public article summary error:", error);
    res.set("Cache-Control", "no-store");
    res.status(500).json({error: "Unable to load published articles"});
  }
});

/**
 * Return a public author profile without exposing the private users document.
 * A profile is eligible only when its UID is attached to published reporting.
 */
export const publicAuthor = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.set("Allow", "GET, HEAD");
    res.set("Cache-Control", "no-store");
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const authorId = publicAuthorPathId(req.originalUrl);
  if (!authorId) {
    res.set("Cache-Control", "no-store");
    res.status(404).json({error: "Author profile not found"});
    return;
  }

  try {
    const articleSnapshot = await admin.firestore().collection("articles")
      .where("status", "==", "published")
      .where("authorId", "==", authorId)
      .limit(1)
      .select("authorId")
      .get();
    if (articleSnapshot.empty) {
      res.set("Cache-Control", "public, max-age=60");
      res.status(404).json({error: "Author profile not found"});
      return;
    }

    const userSnapshot = await admin.firestore().collection("users")
      .where(admin.firestore.FieldPath.documentId(), "==", authorId)
      .limit(1)
      .select(
        "displayName",
        "bio",
        "avatarUrl",
        "profileImageUrl",
        "website",
        "isActive",
      )
      .get();
    const userDocument = userSnapshot.docs[0];
    const user = userDocument?.data();
    if (!user || user.isActive === false ||
      typeof user.displayName !== "string" || !user.displayName.trim()) {
      res.set("Cache-Control", "public, max-age=60");
      res.status(404).json({error: "Author profile not found"});
      return;
    }

    res.set("Content-Type", "application/json; charset=utf-8");
    res.set("Cache-Control", "public, max-age=60, s-maxage=300, " +
      "stale-while-revalidate=3600");
    res.set("X-Content-Type-Options", "nosniff");
    res.status(200).json({
      author: {
        id: authorId,
        displayName: user.displayName.trim(),
        bio: typeof user.bio === "string" ? user.bio : null,
        avatarUrl: safePublicProfileUrl(user.avatarUrl),
        profileImageUrl: safePublicProfileUrl(user.profileImageUrl),
        website: safePublicProfileUrl(user.website),
      },
    });
  } catch (error) {
    console.error("Public author profile error:", error);
    res.set("Cache-Control", "no-store");
    res.status(500).json({error: "Unable to load author profile"});
  }
});

/** Serve canonical article HTML, legacy redirects, and real article 404s. */
export const articlePage = functions.https.onRequest(async (req, res) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.set("Allow", "GET, HEAD");
    res.status(405).send("Method not allowed");
    return;
  }

  const requestedPath = new URL(req.originalUrl, SITE_URL).pathname;
  const archiveMatch = requestedPath.match(
    /^\/article\/(\d{4})\/(\d{2})\/(\d{2})\/?$/,
  );
  if (archiveMatch) {
    const publishedOn = `${archiveMatch[1]}-${archiveMatch[2]}-${archiveMatch[3]}`;
    const dayRange = publicationDayRange(publishedOn);
    if (!dayRange) {
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("X-Robots-Tag", "noindex, nofollow");
      res.status(404).send(renderNotFoundDocument(requestedPath));
      return;
    }

    try {
      const snapshot = await admin.firestore().collection("articles")
        .where("status", "==", "published")
        .where("publishedAt", ">=", dayRange.start)
        .where("publishedAt", "<", dayRange.end)
        .orderBy("publishedAt", "desc")
        .limit(100)
        .select(...PUBLIC_ARTICLE_SUMMARY_FIELDS)
        .get();
      const articles = snapshot.docs
        .map((doc) => ({id: doc.id, ...doc.data()} as PublicArticle))
        .filter((article) => article.isActive !== false);
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=300, s-maxage=600, " +
        "stale-while-revalidate=86400");
      res.set("X-Robots-Tag", "noindex, follow");
      res.status(200).send(renderArchiveDocument(publishedOn, articles));
    } catch (error) {
      console.error("Archive renderer error:", error);
      res.set("Cache-Control", "no-store");
      res.set("X-Robots-Tag", "noindex, nofollow");
      res.status(500).send("Unable to load this archive date");
    }
    return;
  }

  const requestedIdentifier = requestArticleIdentifier(req.originalUrl);
  if (!requestedIdentifier) {
    res.set("X-Robots-Tag", "noindex, nofollow");
    res.status(404).send(renderNotFoundDocument(requestedPath));
    return;
  }

  try {
    const article = await findPublishedArticle(requestedIdentifier);
    if (!article) {
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=60");
      res.set("X-Robots-Tag", "noindex, nofollow");
      res.status(404).send(renderNotFoundDocument(requestedPath));
      return;
    }

    const canonicalPath = canonicalArticlePath(article);
    if (!canonicalPath) {
      res.set("X-Robots-Tag", "noindex, nofollow");
      res.status(500).send("Published article is missing a usable slug");
      return;
    }

    if (requestedPath !== canonicalPath) {
      res.set("Cache-Control", "public, max-age=3600");
      res.redirect(301, canonicalPath);
      return;
    }

    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "public, max-age=300, s-maxage=600, " +
      "stale-while-revalidate=86400");
    res.set("X-Content-Type-Options", "nosniff");
    res.status(200).send(renderArticleDocument(article));
  } catch (error) {
    console.error("Article renderer error:", error);
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "no-store");
    res.set("X-Robots-Tag", "noindex, nofollow");
    res.status(500).send("Unable to load this article");
  }
});

/** Serve crawler-ready active tracker pages and real tracker 404s. */
export const trackerPage = functions.https.onRequest(async (req, res) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.set("Allow", "GET, HEAD");
    res.status(405).send("Method not allowed");
    return;
  }

  const requestedPath = new URL(req.originalUrl, SITE_URL).pathname;
  const requestedSlug = requestTrackerSlug(req.originalUrl);
  if (!requestedSlug) {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("X-Robots-Tag", "noindex, nofollow");
    res.status(404).send(renderTrackerNotFoundDocument(requestedPath));
    return;
  }

  try {
    const tracker = await findActiveTracker(requestedSlug);
    if (!tracker || !tracker.name?.trim()) {
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=60");
      res.set("X-Robots-Tag", "noindex, nofollow");
      res.status(404).send(renderTrackerNotFoundDocument(requestedPath));
      return;
    }

    const canonicalPath = `/tracker/${encodeURIComponent(requestedSlug)}`;
    if (requestedPath !== canonicalPath) {
      res.set("Cache-Control", "public, max-age=3600");
      res.redirect(301, canonicalPath);
      return;
    }

    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "public, max-age=300, s-maxage=600, " +
      "stale-while-revalidate=86400");
    res.set("X-Content-Type-Options", "nosniff");
    res.status(200).send(renderTrackerDocument(tracker));
  } catch (error) {
    console.error("Tracker renderer error:", error);
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "no-store");
    res.set("X-Robots-Tag", "noindex, nofollow");
    res.status(500).send("Unable to load this tracker");
  }
});

/** Generate the canonical public sitemap without manufactured dates. */
export const sitemap = functions.https.onRequest(async (req, res) => {
  try {
    const [articles, trackers] = await Promise.all([
      getPublishedArticles(),
      getActiveTrackers(),
    ]);
    const latestHomeChange = articles.reduce<Date | null>((latest, article) => {
      const candidate = significantUpdateDate(article);
      return candidate && (!latest || candidate > latest) ? candidate : latest;
    }, null);
    const entries = [
      ...STATIC_PUBLIC_PATHS.map((path) => ({
        loc: `${SITE_URL}${path}`,
        lastmod: path === "/" ? latestHomeChange || undefined : undefined,
      })),
      ...SECTION_PATHS.map((path) => ({loc: `${SITE_URL}${path}`})),
      ...articles.flatMap((article) => {
        const loc = canonicalArticleUrl(article);
        return loc ? [{
          loc,
          lastmod: significantUpdateDate(article) || undefined,
        }] : [];
      }),
      ...trackers.flatMap((tracker) => tracker.slug ? [{
        loc: `${SITE_URL}/tracker/${encodeURIComponent(tracker.slug)}`,
        lastmod: toDate(tracker.updatedAt) ||
          toDate(tracker.createdAt) || undefined,
      }] : []),
    ];

    setXmlHeaders(res, "application/xml");
    res.status(200).send(renderSitemap(entries));
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

/** Include only originally published articles from the rolling two-day window. */
export const newsSitemap = functions.https.onRequest(async (req, res) => {
  try {
    const articles = await getPublishedArticles();
    const now = Date.now();
    const twoDays = 2 * 24 * 60 * 60 * 1000;
    const eligible = articles.filter((article) => {
      const publishedAt = toDate(article.publishedAt);
      return publishedAt && publishedAt.getTime() <= now &&
        publishedAt.getTime() >= now - twoDays;
    });

    setXmlHeaders(res, "application/xml");
    res.status(200).send(renderNewsSitemap(eligible));
  } catch (error) {
    console.error("News sitemap generation error:", error);
    res.status(500).send("Error generating news sitemap");
  }
});

/** Serve RSS 2.0 and Atom 1.0 from verified published article records. */
export const feed = functions.https.onRequest(async (req, res) => {
  try {
    const articles = await getPublishedArticles();
    const pathname = new URL(req.originalUrl, SITE_URL).pathname;
    if (pathname === "/atom.xml" || pathname === "/feed.xml") {
      const atom = renderAtomFeed(articles);
      if (!atom) {
        res.set("Cache-Control", "no-store");
        res.status(204).send("");
        return;
      }
      setXmlHeaders(res, "application/atom+xml");
      res.status(200).send(atom);
      return;
    }

    setXmlHeaders(res, "application/rss+xml");
    res.status(200).send(renderRssFeed(articles));
  } catch (error) {
    console.error("Feed generation error:", error);
    res.status(500).send("Error generating feed");
  }
});

/** Verify that a request carries a Firebase ID token for a superuser. */
async function isSuperuserRequest(req: functions.https.Request): Promise<boolean> {
  const authorization = req.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  try {
    const token = await admin.auth().verifyIdToken(match[1]);
    const tokenRoles = token.roles;
    if (tokenRoles && typeof tokenRoles === "object" &&
      (tokenRoles as Record<string, unknown>).superuser === true) {
      return true;
    }

    const userSnapshot = await admin.firestore()
      .collection("users")
      .doc(token.uid)
      .get();
    const user = userSnapshot.data();
    return user?.rolesMap?.superuser === true ||
      (Array.isArray(user?.roles) && user.roles.includes("superuser"));
  } catch (error) {
    console.warn("Superuser token verification failed:", error);
    return false;
  }
}

/**
 * One-time migration function to fix article slugs
 * Call this HTTPS endpoint once to migrate all article slugs
 *
 * Usage: send a POST request with a current Firebase superuser ID token in
 * `Authorization: Bearer <token>`. Do not place the token in source control or
 * shell history. Remove the endpoint after the one-time migration is complete.
 */
export const migrateArticleSlugs = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.set("Allow", "POST");
    res.status(405).json({success: false, error: "Method not allowed"});
    return;
  }
  if (!(await isSuperuserRequest(req))) {
    res.set("Cache-Control", "no-store");
    res.status(403).json({success: false, error: "Superuser authorization required"});
    return;
  }

  try {
    console.log("Starting article slug migration...");

    const db = admin.firestore();
    const articlesRef = db.collection("articles");
    const snapshot = await articlesRef.get();

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const updatedArticles: Array<{old: string; new: string; title: string}> = [];

    for (const docSnap of snapshot.docs) {
      const article = docSnap.data();
      const articleId = docSnap.id;

      // Check if slug needs migration
      if (article.slug?.startsWith("articles/")) {
        try {
          // Remove 'articles/' prefix
          const oldSlug = article.slug;
          const newSlug = article.slug.replace("articles/", "");

          await docSnap.ref.update({
            slug: newSlug,
          });

          updated++;
          updatedArticles.push({
            old: oldSlug,
            new: newSlug,
            title: article.title || "No title",
          });
          console.log(`Migrated: ${oldSlug} -> ${newSlug}`);
        } catch (error) {
          errors.push(`${articleId}: ${error}`);
          console.error(`Error migrating article ${articleId}:`, error);
        }
      } else {
        skipped++;
      }
    }

    const result = {
      success: true,
      summary: {
        total: snapshot.size,
        updated,
        skipped,
        errors: errors.length,
      },
      updatedArticles: updatedArticles.slice(0, 10), // Show first 10
      errors: errors.slice(0, 5), // Show first 5 errors
    };

    console.log("Migration complete:", result.summary);
    res.status(200).json(result);
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Note: Contact sync to SendGrid Marketing API is intentionally omitted here
// to avoid requiring the @sendgrid/client dependency. For production-grade
// mailing lists we recommend running a separate sync process (server-side)
// or using SendGrid's marketing lists via a secure backend endpoint.
