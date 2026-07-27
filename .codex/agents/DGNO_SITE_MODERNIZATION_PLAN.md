# DGNO News and Data Modernization Plan

Status: Phase 9 production release complete; field measurement and external-account follow-ups remain
Last updated: 2026-07-27
Scope: DGNO public news, article, tracker, navigation, accessibility, performance, and search-discovery experience on mobile and desktop

This file is the durable source of truth for DGNO site-quality work. Agents should read the ownership and guardrails below before changing public-site behavior, mark only verified work complete, and leave deployment or external-account actions unchecked until the user explicitly authorizes them.

## Mission and non-negotiables

DGNO should be a fast, accessible, trustworthy news and public-data site serving readers who value progressive scrutiny, constitutional analysis, and evidence over party loyalty. Search visibility must be earned through original reporting, public-interest data, accurate metadata, transparent sourcing, useful navigation, and a dependable page experience.

- Editorial facts, quotations, uncertainty, bylines, dates, correction history, and legal framing are never changed for ranking purposes.
- Structured data must match visible page content and verified Firebase records.
- Unknown dates and values stay unknown; they are never replaced with the current time, zero, or invented detail.
- Public routes must have one canonical URL. Alternate legacy URLs should redirect to it.
- Readers who decline analytics remain opted out.
- No agent may commit, push, deploy, submit URLs, send IndexNow notifications, or change external webmaster settings unless the user explicitly authorizes that action. BCP is run only when the user says exactly `run BCP`.

## Agent ownership

| Owner | Primary responsibility | Required skill or operating rule |
| --- | --- | --- |
| Codex integrator | Architecture, React implementation, design system, accessibility, integration, builds, and this plan | Preserve user work; coordinate file ownership; verify before checking off work |
| Beacon | Technical SEO, crawler delivery, metadata, schema, sitemaps, feeds, internal linking, and measurable no-budget discovery | Use `dgno-news-seo`; use current first-party search documentation; never promise rankings |
| Jensen | Article structure, source transparency, author/editorial trust language, and reader-facing standards copy | Use `dgno-news-research` and `dgno-write-article`; preserve “What Happened / What Is Confirmed / What Is Speculated” |
| Lancelot | Tracker methodology, evidence labels, correction trails, freshness meaning, and data-route quality | Use `dgno-news-research` and `dgno-track-events`; distinguish event, update, and publication dates |

If a task crosses owners, the implementation agent owns the code and asks the named editorial agent to review the relevant language or data semantics. Agents must not overwrite another active workstream’s files.

## Success measures

- No horizontal overflow at 320, 375, 390, 768, 1024, and 1440 CSS pixels.
- Header, menus, drawers, dialogs, search, and consent controls work by touch and keyboard.
- Text and interactive controls meet WCAG AA contrast targets.
- Every public route has one visible page heading, coherent landmarks, a working skip link, and correct focus/scroll behavior.
- Article HTML contains a useful title, canonical, social metadata, article content, and valid schema before client JavaScript runs.
- Invalid article and tracker routes return a real not-found response instead of a soft 200.
- Canonicals, internal links, shares, sitemap URLs, and redirects agree on one URL policy.
- Sitemap and news-sitemap dates come from real content changes only.
- The first article image is prioritized; non-critical images remain lazy.
- Public listing views do not download every article body.
- App lint, app build, and Functions build pass before any deployment recommendation.

## Phase 0 — Baseline and safeguards

- [x] Record production mobile and desktop behavior.
- [x] Audit navigation, article, tracker, crawler HTML, schema, sitemap, consent, accessibility, and bundle behavior.
- [x] Confirm the current worktree before implementation.
- [x] Capture post-implementation mobile and desktop screenshots after deployment.
- [ ] Record Search Console and Bing Webmaster baselines. External-account action; explicit authorization required.

## Phase 1 — Cohesive design foundation

Owner: Codex integrator

- [x] Make `app/src/index.css` the CSS-first Tailwind theme source.
- [x] Resolve duplicated and conflicting color, font, spacing, radius, and shadow tokens.
- [x] Reduce `app/tailwind.config.js` to intentional compatibility only.
- [x] Remove the unused Vite starter rules from `app/src/App.css`.
- [x] Add responsive type, content-width, focus, reduced-motion, and safe-area foundations.
- [x] Replace low-contrast gray, blue, and orange combinations with accessible tokens.

## Phase 2 — Responsive navigation and page shell

Owner: Codex integrator; Beacon reviews crawlable link behavior

- [x] Replace JavaScript-at-render viewport branching with CSS-controlled desktop and mobile headers.
- [x] Prevent desktop navigation overflow at intermediate widths.
- [x] Make the “More” menu keyboard, focus, click, and Escape accessible.
- [x] Make the mobile drawer a labeled dialog with focus containment and focus return.
- [x] Remove duplicate tracker navigation entries.
- [x] Add a skip link and one authoritative main landmark.
- [x] Restore scroll to the top on route changes while preserving browser history behavior.

## Phase 3 — Accessibility and privacy primitives

Owner: Codex integrator

- [x] Introduce a reusable accessible dialog primitive for search, newsletter, support, account recovery, and mobile navigation.
- [x] Add accessible names, focus visibility, Escape handling, background scroll lock, and focus restoration.
- [x] Preserve a user’s analytics decline; enable analytics only for an explicit `true` decision.
- [x] Make icon-only controls and floating controls non-overlapping and correctly labeled.
- [x] Use semantic buttons, links, headings, lists, and `time` elements.

## Phase 4 — Homepage, article, tracker, and trust UX

Owners: Codex integrator; Jensen reviews newsroom trust copy; Lancelot reviews tracker semantics

- [x] Remove nested `main` elements and duplicate top-level headings.
- [x] Prioritize the lead story image; keep below-the-fold images lazy.
- [x] Make tags and sections real filtered navigation rather than decorative controls.
- [x] Label trending, latest, and updated states according to actual data semantics.
- [x] Improve article reading width, source presentation, byline transparency, and update/correction labels.
- [x] Improve tracker mobile tables/cards, methodology, source labels, freshness meaning, and empty/error states.
- [x] Add and route About, Contact, Editorial Standards, Corrections, Privacy, and Funding/Independence pages.
- [x] Add truthful author/profile links and visible publisher accountability information, including explicit disclosure of the currently missing operator fact.
- [x] Add a public newsroom form routed privately to DGNO's monitored Proton inbox, with validation, honeypot protection, and request throttling.
- [x] Replace the generic homepage introduction with an evidence-led newsroom hero that makes DGNO's reporting standard and tracker value immediately clear.
- [x] Add persisted light and dark themes to the public site, respect the initial system preference, and keep the authenticated admin experience unchanged.
- [x] Remove public newsletter/subscription pitches while that product is tabled; make reporting, trackers, RSS, and direct return visits the primary reader paths.
- [x] Require a separate, exact server-side newsletter opt-in so configuring the contact-form mail relay cannot restart bulk email.
- [x] Keep one-time and monthly Stripe donation paths prominent on desktop, mobile, About, and the footer without requiring a reader account.
- [x] Make the currently visible public tracker records downloadable as CSV without a subscription or account.

## Phase 5 — Crawler-ready delivery and canonical URLs

Owner: Beacon; Codex integrator owns application/function integration

- [x] Establish one dated article canonical policy across router, cards, shares, metadata, schema, feeds, and sitemaps.
- [x] Redirect undated and mismatched dated article aliases to the canonical URL.
- [x] Return HTTP 404 for missing article and tracker content.
- [x] Deliver useful article and tracker metadata plus visible content without requiring JavaScript.
- [x] Boot the same React experience from crawler-ready article and tracker HTML without a separate stale-content path.
- [x] Keep authenticated dashboard routes out of public indexing.

## Phase 6 — Metadata, schema, feeds, and sitemaps

Owner: Beacon; Jensen and Lancelot verify visible-content truthfulness

- [x] Give every implemented public route exactly one correct canonical, title, description, robots directive, and social card set.
- [x] Use route-owned JSON-LD with stable `@id` values and complete cleanup during client navigation.
- [x] Add `NewsArticle`, `BreadcrumbList`, `Organization`, `WebSite`, `CollectionPage`, or `Dataset` only where visibly supported.
- [x] Correct Twitter card attribute usage.
- [x] Use each article's representative featured photograph for Open Graph and Twitter cards, with the verified DGNO logo only as the no-photo fallback.
- [x] Generate an optional 1200x630 social derivative that physically composites a controlled-storage featured photograph and restrained translucent DGNO logo; keep the unbranded reporting photograph in `NewsArticle.image` and fall back safely when generation is unavailable.
- [x] Generate a general sitemap containing static, section, article, tracker-list, and tracker-detail URLs.
- [x] Generate a rolling news sitemap for eligible recent articles.
- [x] Never manufacture `lastmod` or publication freshness.
- [x] Publish an RSS/Atom feed with canonical URLs and verified dates.
- [x] Keep `robots.txt` aligned with actual public and authenticated routes.
- [ ] Prepare, but do not send, an optional IndexNow workflow.

## Phase 7 — Performance and data loading

Owner: Codex integrator

- [x] Stop the root provider and homepage from independently downloading the full published corpus.
- [x] Use bounded article summaries for cards, search, related content, and section/date pages, with validated section/date API filters.
- [x] Fetch full article content only on the article route or authenticated editor screens.
- [x] Add route-level code splitting where it materially reduces the public bundle.
- [x] Set lead imagery to eager/high priority and define stable dimensions/aspect ratios.
- [x] Avoid loading admin route modules on public routes where practical.
- [ ] Measure production transfer size and Core Web Vitals after deployment.

## Phase 8 — Automated validation and release gate

Owner: Codex integrator; Beacon reviews search artifacts

- [x] Pass application lint with zero errors and zero warnings.
- [x] Pass application production build.
- [x] Pass Firebase Functions lint and build.
- [x] Add retained route assertions for status, canonical, metadata, schema, API filters, and alias redirects.
- [x] Add retained automated accessibility checks for the shared shell and dialogs.
- [x] Recheck local production renders at 320, 375, 390, 768, 1024, and 1440 CSS pixels.
- [x] Complete persistent automated keyboard, focus-return, viewport-overflow, landmark, and serious/critical Axe workflows.
- [x] Validate sitemap, news sitemap, RSS, and structured data against production output.
- [x] Run BCP only after the user says exactly `run BCP`. Completed 2026-07-26 on `v1.0.2`.
- [x] Deploy only after separate explicit user authorization. Completed 2026-07-26 to Firebase project `dgno-675a8`.

## Phase 9 — Public discovery, resilience, and freshness

Owners: Codex integrator; Beacon reviews crawler delivery and search-discovery semantics

- [x] Serve route-correct crawler HTML, canonicals, social metadata, schema, and crawlable links for public section, tracker-directory, investigation, report, tag, and newsroom-trust routes.
- [x] Serve public contributor profiles with route-correct metadata and recent published-work links.
- [x] Return a real noindex 404 for unsupported public-page routes handled by the server renderer.
- [x] Add a bounded mixed-catalog public search API for articles, trackers, and durable DGNO resources without exposing article bodies.
- [x] Add a filterable `/search` results page and upgrade the header search dialog to query the complete bounded public catalog.
- [x] Keep internal search-result URLs out of the index while allowing crawlers to follow result links.
- [x] Add public-route error containment with reload and home recovery paths.
- [x] Keep loading UI in document flow and reserve tracker-directory result space to prevent severe layout shifts.
- [x] Prevent duplicate article promotion across homepage modules and clearly label an older lead story as archival/current-most-recent coverage.
- [x] Use absolute publication dates for stories older than seven days instead of misleading relative-time labels.
- [x] Isolate browser tests to the Firebase demo project and Auth/Firestore emulators so production data is never read during local E2E validation.
- [x] Release Phase 9 only after a new explicit BCP request and separate Firebase deployment authorization. Completed 2026-07-27 on `v1.0.2` and Firebase project `dgno-675a8`.

## Local verification record — 2026-07-27

- `app`: the complete 18-test Playwright suite passed against local Hosting, Functions, Auth, and Firestore emulators. Coverage includes raw canonical HTML, real 404 responses, mixed search, mobile article/tracker CLS below `0.1`, unique homepage story links, themes, Stripe donation links, keyboard/focus behavior, and serious Axe checks.
- `functions`: `npm test` passed all 10 renderer, routing, metadata, social-image, date, and Firebase rewrite assertions; Functions lint passed.
- The focused accessibility regression found a borderline count-badge contrast issue, which was corrected before the full suite passed.
- Test-mode Firebase configuration now uses `demo-dgno` and explicitly connects the browser SDK to local Auth and Firestore emulators. Normal production builds continue to use the configured production Firebase project.
- The public search catalog is intentionally bounded to 500 article summaries and 100 active trackers with a five-minute server cache. It does not return article bodies or private records.
- Local validation itself performed no production writes, IndexNow notifications, or webmaster submissions; the separately authorized release is recorded below.

## Local verification record — 2026-07-24

- `app`: `npm run lint` passed with zero errors and zero warnings; `npm run build` passed without the stale browser-data or oversized-chunk warnings.
- `functions`: `npm run test` passed TypeScript compilation and five retained renderer/date/config/social-image tests after article, archive, tracker, and branded-card integration. The Functions emulator loaded `generateArticleSocialImage`, and the Storage emulator accepted the generated-card read/client-write-denial rules.
- Playwright release coverage uses local Hosting, Functions, and Firestore emulators plus Microsoft Edge. It retains 13 route, API, viewport, keyboard/focus, theme-persistence, Stripe-link, reader-path, and Axe test groups; all 13 pass.
- Generated-asset assertions passed for Tailwind font tokens, `100dvh`, reduced motion, Firebase rewrites, dated canonical generation, HTML sanitization, NewsArticle/tracker schema, sitemap, news sitemap, RSS, and Atom output.
- Firestore rules loaded successfully in the emulator. The public `users`/legacy `authors` collections are no longer anonymously readable, and account owners cannot grant themselves staff roles.
- Offline Hosting/Functions smoke checks confirmed 404 plus `noindex` for missing article and tracker URLs, and 200 responses for the bounded article API and sitemap. Firebase Hosting's local emulator did not emit configured custom Hosting headers, so dashboard `X-Robots-Tag` remains a production-output validation item; the static `firebase.json` rule is present.
- Local production screenshots rendered successfully at 320, 375, 390, 768, 1024, and 1440 CSS pixels. The redesigned homepage was additionally captured and inspected in light and dark modes at 390 and 1440 pixels; all four samples matched the viewport width without horizontal overflow.
- Final public entry bundle after the public theme, reader-return, and Stripe support pass: `app.js` 405.30 kB minified / 127.27 kB gzip, still below Vite's 500 kB chunk threshold and materially below the original 952.95 kB / 256.45 kB baseline. The rich-text editor remains an independent dashboard-only chunk.
- The browser compatibility datasets were refreshed. A non-breaking audit remediation reduced npm advisories from 22 to two high-severity React Router advisories tied to server/RSC action handling, which this client-rendered Firebase SPA does not enable; no forced major downgrade or upgrade was applied.
- The Functions production audit was reduced from 21 advisories (including three critical and six high) to eight moderate Firebase Admin transitive advisories. Clearing those requires the separately planned Firebase Admin major upgrade; no force upgrade was applied.
- `git diff --check` passed. No commit, push, Firebase deployment, production write, migration, IndexNow notification, or webmaster submission was performed.

## Production verification record — 2026-07-26

- BCP pushed the verified modernization release to the `v1.0.2` branch. Firebase deployed Hosting, Functions, Firestore indexes/rules, and Storage rules to project `dgno-675a8` without deleting remote functions.
- The `dgno.us` custom domain returned `200` for the homepage, trust pages, tracker directory, sitemap, news sitemap, RSS, Atom, and bounded public article API. A live article returned crawler-ready canonical HTML and `NewsArticle` schema.
- Missing article and tracker URLs returned true `404` responses with `noindex`; dashboard and login returned `X-Robots-Tag: noindex, nofollow`. A production-only gap in security headers on rewritten `404` responses was corrected and retained in browser coverage.
- Live browser checks covered the homepage and a published article at 390 and 1440 CSS pixels in light and dark themes. Samples had no horizontal overflow, exactly one `h1`, and no serious or critical Axe violations. A nested homepage main landmark found during the pass was corrected and retained in the release suite.
- The public article API returned bounded summaries without article bodies. The sitemap used canonical DGNO URLs, and the RSS/news-sitemap endpoints returned their expected XML document types.
- No newsletter email was sent. Newsletter delivery remains separately opt-in, and no contact-form test message was submitted to the monitored inbox.

## Production verification record — 2026-07-27

- BCP pushed commit `831d629` (`Improve public search, SEO, and resilience`) to `origin/v1.0.2`. Firebase deployed Hosting, Functions, Firestore indexes/rules, and Storage rules to project `dgno-675a8`; `publicSearch` and `publicPage` were created successfully.
- Live `dgno.us` checks returned route-correct `200` HTML, self-canonicals, titles, and `index, follow` directives for the tracker directory, Politics section, and About page. Search returned `200` with `noindex, follow`; an arbitrary unknown route returned a true `404` with `noindex, nofollow`; login remained `200` with `noindex, nofollow`.
- The live mixed-catalog search endpoint returned real resource and article results without article bodies. The 390-pixel browser pass rendered tracker, search, homepage, and article headings with no horizontal overflow or JavaScript errors; all 21 homepage article links were unique.
- Tracker and article CLS measured `0` in the production browser sample. A multi-route homepage sample measured `0.119`, while a separate isolated eight-second homepage sample measured `0.001`; field Core Web Vitals remain the authoritative follow-up because synthetic timing can vary.
- No production content record was changed, no newsletter or contact email was sent, and no IndexNow or webmaster submission was made.

## Known follow-up work

- Verify and publish DGNO's exact legal operator/ownership identity; do not infer or invent that fact.
- Configure and verify a mail-provider API key and sender identity to activate contact-form relay to the monitored Proton inbox. Until then, the endpoint returns an honest temporary-unavailability response without consuming the sender's rate limit.
- Validate representative generated social cards after deployment and add an editorial override only if real photographs expose placement conflicts; social crawlers cannot composite a CSS overlay.
- With separate production-write authorization, backfill branded social derivatives for already-published articles that are not otherwise updated after the generator is deployed.
- Plan the Firebase Functions dependency/runtime upgrade and Java 21 emulator migration separately because the Functions upgrade warns of breaking changes.
- After deployment authorization, validate real Hosting headers, status codes, raw HTML, sitemaps, feeds, schema, Core Web Vitals, consent behavior, and mobile/desktop output in production.
- Monitor route-specific indexing, live search behavior, and field Core Web Vitals as traffic accumulates.
- Revisit the bounded search implementation when the published catalog approaches 500 articles; migrate to a dedicated index only when the scale and operating budget justify it.

## Release order

1. Merge and verify design/accessibility and consent corrections.
2. Merge URL, crawler delivery, schema, sitemap, and feed corrections.
3. Merge bounded data loading, public trust pages, and article/tracker UX.
4. Run lint and builds; resolve all regressions.
5. With explicit authorization, run BCP.
6. With separate explicit authorization, deploy Firebase Hosting and Functions.
7. Verify live HTTP status, raw HTML, mobile/desktop UI, schema, sitemaps, and analytics consent.
8. Only with explicit authorization, submit or configure external webmaster tools.

## Decision log

- 2026-07-24: CSS-first Tailwind tokens will replace duplicated v3-style theme configuration.
- 2026-07-24: Responsive navigation will use CSS media behavior instead of `window.innerWidth` render branching.
- 2026-07-24: Dated article URLs are the intended canonical form because existing internal card links already expose them and they communicate archive context.
- 2026-07-24: SEO work must improve reader value and evidence clarity; it may not reshape reporting to satisfy a query.
- 2026-07-24: Article social metadata uses the representative featured photograph. A translucent DGNO mark is acceptable only in a physically generated social derivative; `NewsArticle.image` continues to identify the underlying reporting image.
- 2026-07-24: This implementation may edit and build locally. Commit, push, deploy, and external submissions remain unauthorized.
- 2026-07-24: Newsletter and public subscription acquisition are tabled. Public calls to action prioritize reporting, trackers, RSS, and voluntary donations until DGNO deliberately reopens an email product.
- 2026-07-24: Light and dark themes apply only to the consumer site. The selected public preference persists locally and is removed from the document when a reader enters the staff login/admin surface.
- 2026-07-24: Public donations use DGNO's verified Stripe Payment Links for one-time and monthly support and do not require a DGNO account.
- 2026-07-26: BCP and Firebase deployment were explicitly authorized. Newsletter email remains off by default and requires the separate exact server-side opt-in `DGNO_NEWSLETTER_EMAIL_ENABLED=true`; a contact-form provider key alone cannot activate it.
- 2026-07-27: Public search is a bounded, privacy-conscious discovery layer across article summaries, active trackers, and durable resources. Search-result pages are `noindex, follow`; destination pages remain canonical and indexable.
- 2026-07-27: The user explicitly authorized a new BCP and Firebase deployment. The verified Phase 9 release is live; external webmaster submissions remain unauthorized.
