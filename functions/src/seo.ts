export const SITE_URL = "https://dgno.us";
export const SITE_NAME = "DGNO";
export const PUBLICATION_TIME_ZONE = "America/Los_Angeles";
export const APP_SCRIPT_PATH = "/assets/app.js";
export const APP_STYLE_PATH = "/assets/app.css";

export interface PublicArticle {
  id?: string;
  title?: string;
  slug?: string;
  subtitle?: string;
  summary?: string;
  content?: string;
  featuredImageUrl?: string;
  socialImageUrl?: string;
  featuredImageDescription?: string;
  featuredImageSourceCredit?: string;
  section?: string;
  tags?: unknown;
  authorName?: string;
  status?: string;
  isActive?: boolean;
  publishedAt?: unknown;
  lastUpdatedAt?: unknown;
  createdAt?: unknown;
}

export interface PublicTracker {
  name?: string;
  slug?: string;
  description?: string;
  incidentCount?: number;
  isActive?: boolean;
  updatedAt?: unknown;
  createdAt?: unknown;
}

export interface SitemapEntry {
  loc: string;
  lastmod?: Date;
}

export interface PublicPageLink {
  href: string;
  label: string;
  description?: string;
}

export interface PublicPageDefinition {
  path: string;
  title: string;
  description: string;
  heading: string;
  eyebrow: string;
  robots: "index, follow" | "noindex, follow";
  kind: "page" | "collection" | "section";
  sectionName?: string;
  links?: PublicPageLink[];
}

interface DateParts {
  year: string;
  month: string;
  day: string;
}

export interface PublicationDayRange {
  start: Date;
  end: Date;
}

interface JsonRecord {
  [key: string]: unknown;
}

export function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (value && typeof value === "object") {
    const record = value as {
      toDate?: () => Date;
      toMillis?: () => number;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof record.toDate === "function") {
      return toDate(record.toDate());
    }
    if (typeof record.toMillis === "function") {
      return toDate(record.toMillis());
    }

    const seconds = record.seconds ?? record._seconds;
    if (typeof seconds === "number") {
      return toDate(seconds * 1000);
    }
  }

  return null;
}

export function normalizeArticleSlug(value: string | undefined): string {
  if (!value) return "";

  const parts = value
    .replace(/^https?:\/\/[^/]+/i, "")
    .split(/[/?#]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const articleIndex = parts.lastIndexOf("article");
  const relevant = articleIndex >= 0 ? parts.slice(articleIndex + 1) : parts;
  const dated = relevant.length >= 4 &&
    /^\d{4}$/.test(relevant[0]) &&
    /^\d{2}$/.test(relevant[1]) &&
    /^\d{2}$/.test(relevant[2]);

  const candidate = dated ? relevant.slice(3).join("-") :
    relevant[relevant.length - 1] || "";
  try {
    return decodeURIComponent(candidate);
  } catch {
    return "";
  }
}

function getPublicationDateParts(date: Date): DateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PUBLICATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";

  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
  };
}

function publicationDateTimeToUtc(
  year: number,
  month: number,
  day: number,
): Date {
  const target = Date.UTC(year, month - 1, day, 0, 0, 0);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PUBLICATION_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  let candidate = target;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = formatter.formatToParts(new Date(candidate));
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value || 0);
    const represented = Date.UTC(
      value("year"),
      value("month") - 1,
      value("day"),
      value("hour"),
      value("minute"),
      value("second"),
    );
    const difference = represented - target;
    if (difference === 0) break;
    candidate -= difference;
  }

  return new Date(candidate);
}

export function publicationDayRange(value: string): PublicationDayRange | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day) return null;

  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    start: publicationDateTimeToUtc(year, month, day),
    end: publicationDateTimeToUtc(
      next.getUTCFullYear(),
      next.getUTCMonth() + 1,
      next.getUTCDate(),
    ),
  };
}

export function canonicalArticlePath(article: PublicArticle): string | null {
  const slug = normalizeArticleSlug(article.slug);
  if (!slug) return null;

  const publishedAt = toDate(article.publishedAt);
  if (!publishedAt) return `/article/${encodeURIComponent(slug)}`;

  const {year, month, day} = getPublicationDateParts(publishedAt);
  return `/article/${year}/${month}/${day}/${encodeURIComponent(slug)}`;
}

export function canonicalArticleUrl(article: PublicArticle): string | null {
  const path = canonicalArticlePath(article);
  return path ? `${SITE_URL}${path}` : null;
}

export function significantUpdateDate(article: PublicArticle): Date | null {
  return toDate(article.lastUpdatedAt) || toDate(article.publishedAt) ||
    toDate(article.createdAt);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeXml(value: unknown): string {
  return escapeHtml(value);
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function sectionSlug(section: string | undefined): string {
  return String(section || "news")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function validHttpUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ?
      url.toString() : null;
  } catch {
    return null;
  }
}

function imageMimeType(value: string | null): string | null {
  if (!value) return null;
  let pathname = "";
  try {
    pathname = decodeURIComponent(new URL(value).pathname).toLowerCase();
  } catch {
    return null;
  }

  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  return null;
}

function articleTags(article: PublicArticle): string[] {
  return Array.isArray(article.tags) ? article.tags.filter((tag): tag is string =>
    typeof tag === "string" && tag.trim().length > 0) : [];
}

function descriptionFor(article: PublicArticle): string {
  return article.summary?.trim() || article.subtitle?.trim() ||
    `Read ${article.title || "this article"} from DGNO.`;
}

const ALLOWED_ARTICLE_TAGS = new Set([
  "a", "b", "blockquote", "br", "code", "dd", "div", "dl", "dt",
  "em", "figcaption", "figure", "h2", "h3", "h4", "h5", "h6", "hr",
  "i", "img", "li", "ol", "p", "pre", "s", "small", "span", "strong",
  "sub", "sup", "table", "tbody", "td", "th", "thead", "tr", "u", "ul",
]);

const VOID_ARTICLE_TAGS = new Set(["br", "hr", "img"]);
const GLOBAL_ARTICLE_ATTRIBUTES = new Set([
  "aria-label", "class", "colspan", "height", "id", "rowspan", "title",
  "width",
]);

function decodeAttributeForValidation(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_match, hex: string) => {
      const codePoint = Number.parseInt(hex, 16);
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : "";
    })
    .replace(/&#([0-9]+);?/g, (_match, digits: string) => {
      const codePoint = Number.parseInt(digits, 10);
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : "";
    })
    .replace(/&colon;/gi, ":")
    .replace(/&tab;/gi, "\t")
    .replace(/&newline;/gi, "\n");
}

function isSafeArticleUrl(value: string): boolean {
  const normalized = decodeAttributeForValidation(value)
    .replace(/[\u0000-\u0020\u007f]+/g, "")
    .toLowerCase();
  return !normalized.startsWith("javascript:") &&
    !normalized.startsWith("vbscript:") &&
    !normalized.startsWith("data:text/html");
}

function sanitizeArticleTag(rawTag: string): string {
  if (/^<!--/.test(rawTag)) return "";
  const tagMatch = rawTag.match(/^<\s*(\/?)\s*([a-z0-9-]+)([\s\S]*?)>$/i);
  if (!tagMatch) return "";

  const closing = tagMatch[1] === "/";
  const tagName = tagMatch[2].toLowerCase();
  if (!ALLOWED_ARTICLE_TAGS.has(tagName)) return "";
  if (closing) return VOID_ARTICLE_TAGS.has(tagName) ? "" : `</${tagName}>`;

  const allowed = new Set(GLOBAL_ARTICLE_ATTRIBUTES);
  if (tagName === "a") {
    allowed.add("href");
    allowed.add("rel");
    allowed.add("target");
  }
  if (tagName === "img") {
    allowed.add("alt");
    allowed.add("loading");
    allowed.add("src");
  }

  const attributes: string[] = [];
  const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = attributePattern.exec(tagMatch[3])) !== null) {
    const name = match[1].toLowerCase();
    if (!allowed.has(name) || name.startsWith("on")) continue;
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if ((name === "href" || name === "src") && !isSafeArticleUrl(value)) {
      continue;
    }
    if (name === "target" && value !== "_blank" && value !== "_self") {
      continue;
    }
    attributes.push(`${name}="${escapeHtml(value)}"`);
  }

  if (tagName === "a" && attributes.some((item) => item === "target=\"_blank\"")) {
    const relIndex = attributes.findIndex((item) => item.startsWith("rel="));
    if (relIndex >= 0) attributes.splice(relIndex, 1);
    attributes.push("rel=\"noopener noreferrer\"");
  }

  const suffix = attributes.length > 0 ? ` ${attributes.join(" ")}` : "";
  return `<${tagName}${suffix}>`;
}

/**
 * Preserve ordinary newsroom markup while excluding executable or embedding
 * surfaces from function-rendered HTML. React still renders the stored article
 * after boot, so this is a crawler-safe first response rather than a data write.
 */
export function sanitizeArticleHtml(value: string | undefined): string {
  if (!value) return "";
  const withoutActiveContent = value
    .replace(/<(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form)\b[^>]*\/?\s*>/gi, "")
    .replace(/<\/?(?:html|head|body|base|link|meta)\b[^>]*>/gi, "");
  return withoutActiveContent.replace(/<[^>]*>/g, sanitizeArticleTag);
}

function organizationSchema(): JsonRecord {
  return {
    "@type": "NewsMediaOrganization",
    "@id": `${SITE_URL}/#organization`,
    "name": SITE_NAME,
    "url": `${SITE_URL}/`,
    "logo": {
      "@type": "ImageObject",
      "url": `${SITE_URL}/logo.png`,
      "width": 500,
      "height": 500,
    },
    "sameAs": [
      "https://www.tiktok.com/@dgnonews",
      "https://www.instagram.com/dgnonews",
    ],
  };
}

function websiteSchema(): JsonRecord {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    "url": `${SITE_URL}/`,
    "name": SITE_NAME,
    "publisher": {"@id": `${SITE_URL}/#organization`},
    "inLanguage": "en-US",
  };
}

function articleSchema(
  article: PublicArticle,
  canonicalUrl: string,
  featuredImage: string | null,
): JsonRecord {
  const publishedAt = toDate(article.publishedAt);
  const modifiedAt = toDate(article.lastUpdatedAt);
  const tags = articleTags(article);
  const schema: JsonRecord = {
    "@type": "NewsArticle",
    "@id": `${canonicalUrl}#article`,
    "url": canonicalUrl,
    "mainEntityOfPage": {"@type": "WebPage", "@id": canonicalUrl},
    "headline": article.title || "",
    "description": descriptionFor(article),
    "publisher": {"@id": `${SITE_URL}/#organization`},
    "isPartOf": {"@id": `${SITE_URL}/#website`},
    "inLanguage": "en-US",
  };

  if (featuredImage) schema.image = [featuredImage];
  if (publishedAt) schema.datePublished = publishedAt.toISOString();
  if (modifiedAt) schema.dateModified = modifiedAt.toISOString();
  if (article.authorName?.trim()) {
    schema.author = {"@type": "Person", "name": article.authorName.trim()};
  }
  if (article.section?.trim()) schema.articleSection = article.section.trim();
  if (tags.length > 0) schema.keywords = tags;
  return schema;
}

function breadcrumbSchema(
  article: PublicArticle,
  canonicalUrl: string,
): JsonRecord {
  const section = article.section?.trim() || "News";
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": section,
        "item": `${SITE_URL}/articles/${sectionSlug(section)}`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title || "Article",
        "item": canonicalUrl,
      },
    ],
  };
}

function appAssets(): string {
  return [
    `<link rel="stylesheet" href="${APP_STYLE_PATH}">`,
    `<script type="module" src="${APP_SCRIPT_PATH}"></script>`,
  ].join("\n    ");
}

const PUBLIC_PAGE_DEFINITIONS: Record<string, PublicPageDefinition> = {
  "/trackers": {
    path: "/trackers",
    title: "Public-interest data trackers | DGNO",
    description: "Explore DGNO's active incident and accountability trackers, including methodology, source records, and downloadable public data.",
    heading: "DGNO Trackers",
    eyebrow: "Public-interest data",
    robots: "index, follow",
    kind: "collection",
  },
  "/reports": {
    path: "/reports",
    title: "BLS Jobs Report - Economic Data & Analysis | DGNO",
    description: "Interactive Bureau of Labor Statistics employment data visualization. Track unemployment, job growth, labor participation, wages, and economic trends.",
    heading: "BLS Jobs Report",
    eyebrow: "Public economic data",
    robots: "index, follow",
    kind: "page",
  },
  "/investigations": {
    path: "/investigations",
    title: "Investigations | DGNO",
    description: "Browse DGNO investigations featuring documented sources, timelines, and key relationships.",
    heading: "Investigations",
    eyebrow: "Documented reporting",
    robots: "index, follow",
    kind: "collection",
    links: [{
      href: "/investigations/epstein-files",
      label: "Epstein Files investigation board",
      description: "Explore people, documents, timelines, and source links.",
    }],
  },
  "/investigations/epstein-files": {
    path: "/investigations/epstein-files",
    title: "Epstein Files Investigation Board | DGNO",
    description: "Explore DGNO's Epstein Files investigation board: an interactive map of people, documents, timelines, and verified source links.",
    heading: "Epstein Files Investigation Board",
    eyebrow: "Interactive investigation",
    robots: "index, follow",
    kind: "page",
  },
  "/about": {
    path: "/about",
    title: "About DGNO - Independent, Pro-Democracy News",
    description: "Learn about DGNO's independent, evidence-led journalism, public-interest data, editorial mission, and commitment to accountable government.",
    heading: "About DGNO",
    eyebrow: "Independent journalism",
    robots: "index, follow",
    kind: "page",
  },
  "/contact": {
    path: "/contact",
    title: "Contact DGNO | DGNO",
    description: "Reach the newsroom about reporting, corrections, tracker records, accessibility, or general questions.",
    heading: "Contact DGNO",
    eyebrow: "Newsroom contact",
    robots: "index, follow",
    kind: "page",
  },
  "/editorial-standards": {
    path: "/editorial-standards",
    title: "Editorial Standards | DGNO",
    description: "Read DGNO's standards for skeptical, constitutional, evidence-led reporting and honest treatment of uncertainty.",
    heading: "Editorial Standards",
    eyebrow: "How DGNO reports",
    robots: "index, follow",
    kind: "page",
  },
  "/corrections": {
    path: "/corrections",
    title: "Corrections and Updates | DGNO",
    description: "Read how DGNO handles factual corrections, clarifications, and later developments so readers can understand what changed and why.",
    heading: "Corrections and Updates",
    eyebrow: "Accountability",
    robots: "index, follow",
    kind: "page",
  },
  "/funding": {
    path: "/funding",
    title: "Funding and Independence | DGNO",
    description: "Learn how DGNO approaches reader support, editorial independence, ownership transparency, and conflicts of interest.",
    heading: "Funding and Independence",
    eyebrow: "Reader-supported journalism",
    robots: "index, follow",
    kind: "page",
  },
  "/privacy": {
    path: "/privacy",
    title: "Privacy Policy - DGNO",
    description: "DGNO's privacy policy explains how personal information, cookies, analytics choices, and reader privacy are handled.",
    heading: "Privacy Policy",
    eyebrow: "Reader privacy",
    robots: "index, follow",
    kind: "page",
  },
  "/search": {
    path: "/search",
    title: "Search DGNO",
    description: "Search DGNO reporting, accountability trackers, investigations, and public data resources.",
    heading: "Search DGNO",
    eyebrow: "Reporting and public data",
    robots: "noindex, follow",
    kind: "collection",
  },
};

const PUBLIC_SECTION_NAMES: Record<string, string> = {
  "politics": "Politics",
  "immigration": "Immigration",
  "legislation": "Legislation",
  "foreign-affairs": "Foreign Affairs",
  "economy": "Economy",
  "white-house": "White House",
  "courts": "Courts",
  "congress": "Congress",
  "human-rights": "Human Rights",
  "environment": "Environment",
  "business": "Business",
  "tech": "Tech",
  "finance": "Finance",
  "trump-presidency": "Trump Presidency",
  "data-analysis": "Data Analysis",
  "opinion": "Opinion",
  "fact-check": "Fact-Check",
  "health": "Health",
  "science": "Science",
  "sports": "Sports",
};

function normalizedPublicPath(value: string): string {
  const pathname = value.split(/[?#]/, 1)[0] || "/";
  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
}

function tagLabel(slug: string): string {
  return slug.split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function publicPageDefinition(
  requestPath: string,
): PublicPageDefinition | null {
  const path = normalizedPublicPath(requestPath);
  const exact = PUBLIC_PAGE_DEFINITIONS[path];
  if (exact) return {...exact};

  const sectionMatch = path.match(/^\/articles\/([a-z0-9-]+)$/);
  if (sectionMatch) {
    const sectionName = PUBLIC_SECTION_NAMES[sectionMatch[1]];
    if (!sectionName) return null;
    return {
      path,
      title: `${sectionName} News - Data-Driven Coverage | DGNO`,
      description: `Latest ${sectionName.toLowerCase()} news and analysis. Independent, evidence-led coverage from DGNO.`,
      heading: `${sectionName} News`,
      eyebrow: "DGNO reporting",
      robots: "index, follow",
      kind: "section",
      sectionName,
    };
  }

  const tagMatch = path.match(/^\/tag\/([a-z0-9-]{1,100})$/);
  if (tagMatch) {
    const label = tagLabel(tagMatch[1]);
    return {
      path,
      title: `${label} news and analysis | DGNO`,
      description: `Recent DGNO reporting filed under ${label}.`,
      heading: label,
      eyebrow: "Topic archive",
      robots: "index, follow",
      kind: "collection",
    };
  }

  return null;
}

function publicPageBreadcrumbs(
  definition: PublicPageDefinition,
  canonicalUrl: string,
): JsonRecord {
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "DGNO",
        "item": `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": definition.heading,
        "item": canonicalUrl,
      },
    ],
  };
}

export function renderPublicPageDocument(
  definition: PublicPageDefinition,
  dynamicLinks: PublicPageLink[] = [],
): string {
  const canonicalUrl = `${SITE_URL}${definition.path}`;
  const links = [...(definition.links || []), ...dynamicLinks];
  const pageType = definition.kind === "page" ? "WebPage" : "CollectionPage";
  const pageSchema: JsonRecord = {
    "@type": pageType,
    "@id": `${canonicalUrl}#page`,
    "url": canonicalUrl,
    "name": definition.heading,
    "description": definition.description,
    "isPartOf": {"@id": `${SITE_URL}/#website`},
    "inLanguage": "en-US",
  };
  if (links.length > 0) {
    pageSchema.mainEntity = {
      "@type": "ItemList",
      "itemListElement": links.map((link, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": link.label,
        "url": new URL(link.href, SITE_URL).toString(),
      })),
    };
  }
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema(),
      websiteSchema(),
      pageSchema,
      publicPageBreadcrumbs(definition, canonicalUrl),
    ],
  };
  const linkMarkup = links.map((link) => `
          <li>
            <a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>
            ${link.description ? `<p>${escapeHtml(link.description)}</p>` : ""}
          </li>`).join("");

  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(definition.title)}</title>
    <meta name="description" content="${escapeHtml(definition.description)}">
    <meta name="robots" content="${definition.robots}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="alternate" type="application/rss+xml" title="DGNO RSS" href="${SITE_URL}/rss.xml">
    <link rel="alternate" type="application/atom+xml" title="DGNO Atom" href="${SITE_URL}/atom.xml">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:title" content="${escapeHtml(definition.title)}">
    <meta property="og:description" content="${escapeHtml(definition.description)}">
    <meta property="og:image" content="${SITE_URL}/logo.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(definition.title)}">
    <meta name="twitter:description" content="${escapeHtml(definition.description)}">
    <meta name="twitter:image" content="${SITE_URL}/logo.png">
    <meta name="theme-color" content="#6e86ff">
    <script type="application/ld+json" data-seo-server="public-page">${safeJson(graph)}</script>
    ${appAssets()}
  </head>
  <body>
    <div id="root" data-server-rendered="public-page">
      <header class="border-b border-stone/30 bg-white">
        <div class="mx-auto max-w-7xl px-4 py-4">
          <a href="/" aria-label="DGNO home"><img src="/logo.png" alt="DGNO" width="48" height="48"></a>
        </div>
      </header>
      <main class="mx-auto max-w-5xl px-4 py-8">
        <p>${escapeHtml(definition.eyebrow)}</p>
        <h1>${escapeHtml(definition.heading)}</h1>
        <p>${escapeHtml(definition.description)}</p>
        ${linkMarkup ? `<ul>${linkMarkup}\n        </ul>` : ""}
      </main>
    </div>
  </body>
</html>`;
}

export function renderPublicPageNotFoundDocument(requestPath: string): string {
  const safePath = escapeHtml(requestPath);
  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found | DGNO</title>
    <meta name="description" content="The requested DGNO page could not be found.">
    <meta name="robots" content="noindex, nofollow">
    <link rel="icon" type="image/png" href="/favicon.png">
    ${appAssets()}
  </head>
  <body>
    <div id="root" data-server-rendered="not-found">
      <main class="mx-auto max-w-3xl px-4 py-16">
        <h1>Page not found</h1>
        <p>No public page exists at <code>${safePath}</code>.</p>
        <p><a href="/">Return to the DGNO homepage</a></p>
      </main>
    </div>
  </body>
</html>`;
}

export function renderArticleDocument(article: PublicArticle): string {
  const canonicalUrl = canonicalArticleUrl(article);
  if (!canonicalUrl || !article.title?.trim()) {
    return renderNotFoundDocument("/article/");
  }

  const pageTitle = `${article.title.trim()} | ${SITE_NAME}`;
  const description = descriptionFor(article);
  const featuredImage = validHttpUrl(article.featuredImageUrl);
  const generatedSocialImage = validHttpUrl(article.socialImageUrl);
  const socialImage = generatedSocialImage ||
    featuredImage || `${SITE_URL}/logo.png`;
  const imageType = imageMimeType(socialImage);
  const publishedAt = toDate(article.publishedAt);
  const modifiedAt = toDate(article.lastUpdatedAt);
  const tags = articleTags(article);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema(),
      websiteSchema(),
      articleSchema(article, canonicalUrl, featuredImage),
      breadcrumbSchema(article, canonicalUrl),
    ],
  };
  const section = article.section?.trim();
  const formattedPublished = publishedAt ? new Intl.DateTimeFormat("en-US", {
    timeZone: PUBLICATION_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(publishedAt) : "";
  const articleContent = sanitizeArticleHtml(article.content?.trim()) ||
    (article.summary ? `<p>${escapeHtml(article.summary)}</p>` : "");

  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <meta name="author" content="${escapeHtml(article.authorName || SITE_NAME)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="alternate" type="application/rss+xml" title="DGNO RSS" href="${SITE_URL}/rss.xml">
    <link rel="alternate" type="application/atom+xml" title="DGNO Atom" href="${SITE_URL}/atom.xml">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(socialImage)}">
    ${imageType ? `<meta property="og:image:type" content="${imageType}">` : ""}
    ${generatedSocialImage ? "<meta property=\"og:image:width\" content=\"1200\">" : ""}
    ${generatedSocialImage ? "<meta property=\"og:image:height\" content=\"630\">" : ""}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(socialImage)}">
    ${publishedAt ? `<meta property="article:published_time" content="${publishedAt.toISOString()}">` : ""}
    ${modifiedAt ? `<meta property="article:modified_time" content="${modifiedAt.toISOString()}">` : ""}
    ${article.authorName ? `<meta property="article:author" content="${escapeHtml(article.authorName)}">` : ""}
    ${section ? `<meta property="article:section" content="${escapeHtml(section)}">` : ""}
    ${tags.map((tag) => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join("\n    ")}
    <meta name="theme-color" content="#6e86ff">
    <script type="application/ld+json" data-seo-server="article-page">${safeJson(graph)}</script>
    ${appAssets()}
  </head>
  <body>
    <div id="root" data-server-rendered="article">
      <header class="border-b border-stone/30 bg-white">
        <div class="mx-auto max-w-7xl px-4 py-4">
          <a href="/" aria-label="DGNO home"><img src="/logo.png" alt="DGNO" width="48" height="48"></a>
        </div>
      </header>
      <main class="mx-auto max-w-4xl px-4 py-8">
        <article>
          ${section ? `<p><a href="/articles/${sectionSlug(section)}">${escapeHtml(section)}</a></p>` : ""}
          <h1>${escapeHtml(article.title)}</h1>
          ${article.subtitle ? `<p>${escapeHtml(article.subtitle)}</p>` : ""}
          ${featuredImage ? `<figure><img src="${escapeHtml(featuredImage)}" alt="${escapeHtml(article.featuredImageDescription || article.title)}" fetchpriority="high"><figcaption>${escapeHtml(article.featuredImageDescription || article.featuredImageSourceCredit || "")}</figcaption></figure>` : ""}
          <p>
            ${article.authorName ? `By ${escapeHtml(article.authorName)}${publishedAt ? " &middot; " : ""}` : ""}
            ${publishedAt ? `<time datetime="${publishedAt.toISOString()}">${escapeHtml(formattedPublished)}</time>` : ""}
            ${modifiedAt ? ` &middot; Updated <time datetime="${modifiedAt.toISOString()}">${escapeHtml(modifiedAt.toISOString())}</time>` : ""}
          </p>
          ${article.summary ? `<aside aria-label="Article summary"><p>${escapeHtml(article.summary)}</p></aside>` : ""}
          <div class="article-content">${articleContent}</div>
        </article>
      </main>
    </div>
  </body>
</html>`;
}

export function renderNotFoundDocument(requestPath: string): string {
  const safePath = escapeHtml(requestPath);
  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Article Not Found | DGNO</title>
    <meta name="description" content="The requested DGNO article could not be found.">
    <meta name="robots" content="noindex, nofollow">
    <link rel="icon" type="image/png" href="/favicon.png">
    ${appAssets()}
  </head>
  <body>
    <div id="root" data-server-rendered="not-found">
      <main class="mx-auto max-w-3xl px-4 py-16">
        <h1>Article not found</h1>
        <p>No published article exists at <code>${safePath}</code>.</p>
        <p><a href="/">Return to the DGNO homepage</a></p>
      </main>
    </div>
  </body>
</html>`;
}

export function renderTrackerDocument(tracker: PublicTracker): string {
  const slug = tracker.slug?.trim();
  const name = tracker.name?.trim();
  if (!slug || !name) return renderTrackerNotFoundDocument("/tracker/");

  const canonicalUrl = `${SITE_URL}/tracker/${encodeURIComponent(slug)}`;
  const description = tracker.description?.trim() ||
    `Public-interest incident data and source records for ${name}.`;
  const updatedAt = significantTrackerDate(tracker);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema(),
      {
        "@type": "Dataset",
        "@id": `${canonicalUrl}#dataset`,
        "name": name,
        "description": description,
        "url": canonicalUrl,
        "creator": {"@id": `${SITE_URL}/#organization`},
        ...(updatedAt ? {"dateModified": updatedAt.toISOString()} : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "DGNO", "item": `${SITE_URL}/`},
          {"@type": "ListItem", "position": 2, "name": "Trackers", "item": `${SITE_URL}/trackers`},
          {"@type": "ListItem", "position": 3, "name": name, "item": canonicalUrl},
        ],
      },
    ],
  };

  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(name)} | DGNO Tracker</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <link rel="icon" type="image/png" href="/favicon.png">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:title" content="${escapeHtml(name)} | DGNO Tracker">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${SITE_URL}/logo.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(name)} | DGNO Tracker">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${SITE_URL}/logo.png">
    <script type="application/ld+json" data-seo-server="tracker-page">${safeJson(graph)}</script>
    ${appAssets()}
  </head>
  <body>
    <div id="root" data-server-rendered="tracker">
      <header class="border-b border-stone/30 bg-white">
        <div class="mx-auto max-w-7xl px-4 py-4">
          <a href="/" aria-label="DGNO home"><img src="/logo.png" alt="DGNO" width="48" height="48"></a>
        </div>
      </header>
      <main class="mx-auto max-w-5xl px-4 py-8">
        <nav aria-label="Breadcrumb"><a href="/trackers">Trackers</a> / ${escapeHtml(name)}</nav>
        <article>
          <p>DGNO public-interest data</p>
          <h1>${escapeHtml(name)}</h1>
          <p>${escapeHtml(description)}</p>
          ${updatedAt ? `<p>Tracker record updated <time datetime="${updatedAt.toISOString()}">${escapeHtml(updatedAt.toISOString())}</time></p>` : ""}
          <h2>Methodology and date meaning</h2>
          <p>Inclusion documents a reported event within this tracker's stated scope; it is not by itself a legal conclusion. Linked sources and record-review labels show the evidence available for individual entries. The tracker update date means the dataset record changed, not that every incident was independently re-verified on that date.</p>
        </article>
      </main>
    </div>
  </body>
</html>`;
}

function significantTrackerDate(tracker: PublicTracker): Date | null {
  return toDate(tracker.updatedAt) || toDate(tracker.createdAt);
}

export function renderTrackerNotFoundDocument(requestPath: string): string {
  const safePath = escapeHtml(requestPath);
  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tracker Not Found | DGNO</title>
    <meta name="description" content="The requested DGNO tracker could not be found.">
    <meta name="robots" content="noindex, nofollow">
    <link rel="icon" type="image/png" href="/favicon.png">
    ${appAssets()}
  </head>
  <body>
    <div id="root" data-server-rendered="not-found">
      <main class="mx-auto max-w-3xl px-4 py-16">
        <h1>Tracker not found</h1>
        <p>No active tracker exists at <code>${safePath}</code>.</p>
        <p><a href="/trackers">Browse active DGNO trackers</a></p>
      </main>
    </div>
  </body>
</html>`;
}

export function renderArchiveDocument(
  publishedOn: string,
  articles: PublicArticle[],
): string {
  const canonicalUrl = `${SITE_URL}/article/${publishedOn.replace(/-/g, "/")}`;
  const displayDate = new Intl.DateTimeFormat("en-US", {
    timeZone: PUBLICATION_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${publishedOn}T12:00:00Z`));
  const items = articles.flatMap((article, index) => {
    const url = canonicalArticleUrl(article);
    if (!url || !article.title?.trim()) return [];
    return [{
      "@type": "ListItem",
      "position": index + 1,
      "url": url,
      "name": article.title.trim(),
    }];
  });
  const graph = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalUrl}#archive`,
    "url": canonicalUrl,
    "name": `DGNO articles published on ${displayDate}`,
    "isPartOf": {"@id": `${SITE_URL}/#website`},
    ...(items.length > 0 ? {
      "mainEntity": {"@type": "ItemList", "itemListElement": items},
    } : {}),
  };
  const articleLinks = items.map((item) =>
    `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a></li>`,
  ).join("\n          ");

  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>News from ${escapeHtml(displayDate)} | DGNO</title>
    <meta name="description" content="Browse DGNO articles published on ${escapeHtml(displayDate)}.">
    <meta name="robots" content="noindex, follow">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <link rel="icon" type="image/png" href="/favicon.png">
    <script type="application/ld+json" data-seo-server="archive-page">${safeJson(graph)}</script>
    ${appAssets()}
  </head>
  <body>
    <div id="root" data-server-rendered="archive">
      <main class="mx-auto max-w-4xl px-4 py-8">
        <h1>Articles published on ${escapeHtml(displayDate)}</h1>
        ${articleLinks ? `<ul>${articleLinks}</ul>` : "<p>No published articles were found for this date.</p>"}
      </main>
    </div>
  </body>
</html>`;
}

export function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map((entry) => {
    const lastmod = entry.lastmod ?
      `\n    <lastmod>${entry.lastmod.toISOString()}</lastmod>` : "";
    return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmod}\n  </url>`;
  }).join("\n");

  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" +
    `${urls}\n</urlset>`;
}

export function renderNewsSitemap(articles: PublicArticle[]): string {
  const urls = articles.flatMap((article) => {
    const canonical = canonicalArticleUrl(article);
    const publishedAt = toDate(article.publishedAt);
    if (!canonical || !publishedAt || !article.title?.trim()) return [];

    return [`  <url>
    <loc>${escapeXml(canonical)}</loc>
    <news:news>
      <news:publication>
        <news:name>${SITE_NAME}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publishedAt.toISOString()}</news:publication_date>
      <news:title>${escapeXml(article.title.trim())}</news:title>
    </news:news>
  </url>`];
  }).join("\n");

  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" " +
    "xmlns:news=\"http://www.google.com/schemas/sitemap-news/0.9\">\n" +
    `${urls}\n</urlset>`;
}

function feedArticles(articles: PublicArticle[]): PublicArticle[] {
  return articles
    .filter((article) => canonicalArticleUrl(article) &&
      toDate(article.publishedAt) && article.title?.trim())
    .sort((a, b) => (toDate(b.publishedAt)?.getTime() || 0) -
      (toDate(a.publishedAt)?.getTime() || 0))
    .slice(0, 50);
}

export function renderRssFeed(articles: PublicArticle[]): string {
  const items = feedArticles(articles).map((article) => {
    const canonical = canonicalArticleUrl(article) as string;
    const publishedAt = toDate(article.publishedAt) as Date;
    const description = descriptionFor(article);
    const categories = [article.section, ...articleTags(article)]
      .filter((value): value is string => Boolean(value))
      .map((value) => `<category>${escapeXml(value)}</category>`)
      .join("\n      ");

    return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(canonical)}</link>
      <guid isPermaLink="true">${escapeXml(canonical)}</guid>
      <pubDate>${publishedAt.toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
      ${categories}
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>DGNO</title>
    <link>${SITE_URL}/</link>
    <description>Independent, evidence-led, pro-democracy news and public-interest reporting.</description>
    <language>en-us</language>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

export function renderAtomFeed(articles: PublicArticle[]): string | null {
  const eligible = feedArticles(articles);
  const updated = eligible.reduce<Date | null>((latest, article) => {
    const candidate = significantUpdateDate(article);
    return candidate && (!latest || candidate > latest) ? candidate : latest;
  }, null);
  if (!updated) return null;

  const entries = eligible.map((article) => {
    const canonical = canonicalArticleUrl(article) as string;
    const publishedAt = toDate(article.publishedAt) as Date;
    const changedAt = significantUpdateDate(article) || publishedAt;
    return `  <entry>
    <title>${escapeXml(article.title)}</title>
    <id>${escapeXml(canonical)}</id>
    <link href="${escapeXml(canonical)}" />
    <published>${publishedAt.toISOString()}</published>
    <updated>${changedAt.toISOString()}</updated>
    <summary type="html">${escapeXml(descriptionFor(article))}</summary>
  </entry>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>DGNO</title>
  <id>${SITE_URL}/</id>
  <link href="${SITE_URL}/" />
  <link href="${SITE_URL}/atom.xml" rel="self" type="application/atom+xml" />
  <updated>${updated.toISOString()}</updated>
  <author><name>DGNO</name></author>
${entries}
</feed>`;
}
