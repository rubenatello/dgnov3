# Official search and news standards

Verified 2026-07-24. Re-open the relevant first-party page before relying on a requirement that may have changed.

## Google Search

- [Search Essentials](https://developers.google.com/search/docs/essentials): meet technical requirements, avoid spam, publish helpful people-first content, use descriptive language, and keep links crawlable. Eligibility does not guarantee crawling, indexing, or serving.
- [Helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content): serve an intended audience and add first-hand or original value. Avoid broad automated production, trend chasing, and summaries that add little.
- [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article): use truthful `Article` or `NewsArticle` data to clarify headline, images, dates, and authors. Match the visible page, validate the markup, and test Google's rendered view.
- [News sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap): use news metadata for articles published during the last two days. Update one stable sitemap instead of creating a new file for each release.
- [General sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): list canonical absolute URLs and accurate `lastmod` values. A sitemap is a hint, not an indexing guarantee.
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals): target field LCP within 2.5 seconds, INP below 200 milliseconds, and CLS below 0.1 at the 75th percentile while evaluating the overall page experience.
- [Site names](https://developers.google.com/search/docs/appearance/site-names): keep the site name consistent and provide one `WebSite` entity on the crawlable home page.
- [Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization): publish only real organization, logo, identity, contact, and profile information. Keep the logo crawlable and representative.

## Google News

- [Google News policies](https://support.google.com/news/publisher-center/answer/6204050?hl=en): provide clear dates, bylines, author and publisher information, ownership or network information, contact details, and conspicuous sponsorship disclosure. Avoid misleading previews and manipulated content.
- [News discovery](https://support.google.com/news/publisher-center/answer/9606634?hl=en): Google automatically considers compliant web content; publishers do not need to apply. Use Search Console and news sitemaps to diagnose discovery, without assuming inclusion.
- [Automatically generated publication pages](https://support.google.com/news/publisher-center/answer/15898024?hl=en): Publisher Center no longer controls ordinary Google News landing pages. Google uses site favicons and site-name signals for automatically generated publication pages.
- [Technical guidelines](https://support.google.com/news/publisher-center/answer/9606708?hl=en): use permanent section and article URLs, crawlable HTML links, accessible article text, identifiable headlines and times, and UTF-8 content.
- [Ranking within Google News](https://support.google.com/news/publisher-center/answer/9606702?hl=en): relevance, prominence, authority, freshness, usability, location, and language influence automated ranking. Payment does not improve ranking.

## Bing and AI search surfaces

- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a): support crawl efficiency, URL consolidation, content clarity, trustworthy signals, accurate sitemaps, and crawlable internal links. These foundations also affect Bing's AI and grounding experiences.
- [IndexNow](https://www.bing.com/webmasters/help/indexnow-0z209wby): notify participating engines when a URL is added, updated, or deleted. Submission can accelerate discovery but does not guarantee indexing or traffic.

## Validation tools

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- Google Search Console URL Inspection, Page Indexing, News performance, Core Web Vitals, and Manual Actions reports require authorized property access.
- Bing Webmaster Tools URL Inspection, Site Explorer, Site Scan, IndexNow, and Sitemaps reports require authorized site access.
