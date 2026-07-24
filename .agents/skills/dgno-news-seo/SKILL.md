---
name: dgno-news-seo
description: Audit and improve DGNO's ethical search and news discoverability across technical SEO, Google News, Bing, structured data, sitemaps, crawlability, indexing, Core Web Vitals, internal linking, headlines, publisher transparency, and measurement. Use when reviewing SEO, diagnosing indexing or organic-traffic problems, optimizing article templates or metadata, preparing news sitemaps or IndexNow, validating schema/canonicals/robots, or prioritizing no-budget organic growth for the independent news site. Do not use it to keyword-stuff, buy or spam links, create search-engine-first content, disguise advertising, falsify freshness or authority, or promise rankings.
---

# DGNO News SEO

Improve discoverability without weakening DGNO's journalism. Treat search eligibility, indexing, appearance, ranking, and traffic as separate outcomes; never imply that a technical fix guarantees any of them.

## Workflow

1. Define the property, page types, date window, audience, search surface, and desired outcome. Separate a site audit from an article optimization, indexing diagnosis, implementation, or measurement request.
2. Read `references/dgno-baseline.md` for repository-specific context. Verify the current code and production behavior because the baseline can become stale.
3. Read the relevant sections of `references/official-standards.md`, then browse the linked first-party documentation for current requirements. Use live official sources for time-sensitive search behavior.
4. Collect evidence from both raw response HTML and the rendered page. Check HTTP status, redirects, canonical URL, robots directives, sitemap membership, internal links, visible copy, metadata, structured data, images, dates, authorship, mobile behavior, and performance.
5. When authorized account data is available through a connector or user-provided export, compare impressions, indexed pages, queries, click-through rate, Core Web Vitals, crawl errors, and manual actions. Never request a password or recovery code.
6. Classify each finding as `blocker`, `high`, `medium`, `low`, or `experiment`. State the observation, supporting evidence, likely impact, confidence, smallest fix, and validation method. Label hypotheses as hypotheses.
7. Prioritize changes that compound without an ad budget: crawlable permanent pages, original reporting, topical depth, accurate news metadata, useful internal links, accessible images, fast pages, RSS or feeds, news sitemaps, and legitimate update notifications.
8. Implement only the requested scope. Preserve the established React, Firebase, article, and tracker architecture. Run focused checks and the production build after code changes.
9. Establish a baseline before release and a measurement window after release. Report leading indicators before traffic outcomes, and account for news cycles, seasonality, and small samples.

## Audit lanes

### Discovery and indexing

- Verify that public pages return meaningful `200`, redirect, `404`, or `410` responses rather than misleading soft errors.
- Verify canonical consistency across HTML, sitemap, internal links, structured data, and redirects.
- Inspect `robots.txt`, robots meta tags, HTTP directives, login walls, JavaScript dependencies, sitemap freshness, and crawlable HTML links.
- Treat sitemap inclusion and IndexNow submission as discovery hints, not proof of indexing or ranking.

### News eligibility and trust

- Verify unique permanent article URLs, visible headlines and timestamps, clear bylines, author or editorial-team information, publisher ownership, editorial contact information, corrections, and sponsorship disclosure.
- Verify that `NewsArticle` data matches visible content and uses truthful headline, image, publication and modification dates, author, publisher, language, and canonical identifiers.
- Preserve original reporting, sourcing, corrections, and uncertainty. Never manufacture expertise, first-hand experience, or a human byline.

### Search appearance and page experience

- Check titles, headings, descriptions, site name, favicon, Open Graph fields, social image dimensions and media type, alt text, and snippet accuracy.
- Measure LCP, INP, and CLS with field data when available and lab data for diagnosis. Do not treat a lab score as field performance.
- Give above-the-fold article text and the primary news image appropriate loading priority without degrading accessibility or stability.

### Editorial optimization

- Use the words readers use only when they accurately describe the reported subject. Prefer a precise headline and lede over a broader high-volume phrase.
- Strengthen internal links when they provide context, chronology, primary documents, topic depth, or related original reporting.
- Do not add repetitive keywords, filler sections, trend-chasing pages, doorway pages, hidden text, misleading previews, or mass-produced summaries.

### Measurement

- Distinguish crawl discovered, indexed, shown, clicked, engaged, subscribed, and retained.
- Recommend Google Search Console and Bing Webmaster Tools workflows without claiming access that is not present.
- Compare page types and cohorts. Record the release date, changed URLs, expected signal, observation window, and rollback condition.

## Required deliverable

Return:

1. Scope and evidence collected.
2. Confirmed findings ordered by severity.
3. Unknowns or account data needed.
4. A prioritized plan split into immediate fixes, medium-term work, and experiments.
5. Exact files or URLs affected.
6. Validation and measurement steps.
7. Any changes made, checks run, and remaining risks.

## Boundaries

- Never change a factual claim, quotation, legal posture, event date, publication date, modification date, author identity, correction history, or source merely to improve search performance.
- Never add structured data that is not supported by visible page content or verified newsroom information.
- Never purchase links, automate outreach spam, impersonate community members, conceal sponsorship, scrape private analytics, or evade crawler and platform controls.
- Never request or store Search Console, Bing, Firebase, social, or analytics passwords. Use existing authenticated connectors, scoped tokens, or user-operated steps.
- Do not submit URLs, send IndexNow notifications, alter external webmaster settings, deploy, commit, or push unless the user explicitly authorizes that action. Only run BCP when the user says exactly `run BCP`.
