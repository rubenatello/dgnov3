# DGNO SEO baseline

Repository snapshot verified 2026-07-24. Treat these as audit leads, not permanent truths. Reinspect the code and production response before recommending a change.

## Architecture

- Public site: `https://dgno.us`
- Front end: React/Vite single-page application under `app/`
- Hosting: Firebase Hosting serves `app/dist` and rewrites application routes to `index.html`
- Dynamic sitemap: Firebase function `sitemap` in `functions/src/index.ts`, exposed at `/sitemap.xml`
- Metadata component: `app/src/components/SEOHead.tsx`
- Shared schema constants: `app/src/utils/seoConstants.ts`
- Default source head: `app/index.html`
- Crawler rules: `app/public/robots.txt`

## Existing strengths

- `robots.txt` advertises the XML sitemap.
- Published articles, static pages, investigations, and active trackers are represented in the general sitemap.
- Article routes use permanent date-prefixed slugs and set canonical URLs.
- Article pages generate `NewsArticle`; the home page and layout provide organization signals; section/date pages add breadcrumbs; the About page adds FAQ data.
- Firebase Hosting sends long-lived immutable caching for hashed assets and baseline security headers.
- Public articles display bylines, publication dates, sections, source-backed copy, and share links.

## Audit priorities

1. Compare raw HTML with the rendered DOM. Most route-specific metadata and JSON-LD are injected client-side, while `app/index.html` contains generic home-page metadata. Verify what Googlebot, Googlebot-News, Bingbot, link unfurlers, and no-JavaScript clients actually receive.
2. Add or evaluate a separate Google News sitemap. The current sitemap uses only the generic sitemap namespace and includes the whole site; Google recommends news metadata only for articles from the last two days.
3. Verify freshness semantics. The sitemap currently falls back to the current time when an article lacks `lastUpdatedAt`, which can imply an update that did not occur.
4. Isolate JSON-LD ownership. The article metadata component removes the first generic `application/ld+json` node instead of targeting only its own schema block, which can conflict with organization, breadcrumb, or FAQ data.
5. Verify article images. The default is the favicon, the declared Open Graph media type is always PNG, and a featured article image is lazy-loaded even when it may be the LCP element.
6. Validate author and publisher transparency. Confirm that bylines lead to useful public author information or an accurately described editorial-team page and that ownership, corrections, standards, and contact details are easy to find.
7. Inspect crawlable links and article text in the source and rendered DOM. Google News guidance favors permanent HTML links and accessible article body text rather than content available only after JavaScript execution.
8. Compare duplicate sitemap implementations in `functions/src/index.ts` and `app/src/utils/sitemapGenerator.ts`; define one production source of truth.
9. Check for an RSS or Atom feed, WebSite site-name data, favicon variants, image aspect ratios, and IndexNow integration. Do not implement any of these solely for a checklist; confirm the user and discovery value.
10. Establish real baselines in Search Console, Bing Webmaster Tools, analytics, and field Core Web Vitals before attributing traffic changes to SEO work.

## Change safety

- Preserve article URLs unless a migration includes redirects, canonicals, sitemap updates, and monitoring.
- Never regenerate publication or modification timestamps during a build or request unless the underlying editorial record changed.
- Keep dashboards, previews, login pages, and other private or thin utility routes out of search indexes.
- Treat structured-data validation as necessary but not sufficient; confirm the markup matches visible newsroom information.
- Keep external submissions and account configuration separate from code changes and require explicit authorization.
