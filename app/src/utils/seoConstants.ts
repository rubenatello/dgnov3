// Centralized public search and sharing constants.
export const SEO_CONFIG = {
  siteName: 'DGNO',
  siteUrl: 'https://dgno.us',
  publicationTimeZone: 'America/Los_Angeles',
  defaultImage: 'https://dgno.us/logo.png',

  coreKeywords: [
    'data-driven news',
    'pro-democracy news',
    'constitutional news',
    'pro-human rights news',
    'independent news',
    'anti-corruption news',
    'investigative journalism',
    'government accountability',
    'transparency',
  ],

  defaultTitle: 'DGNO - Data-Driven, Independent, Pro-Democracy News',
  defaultDescription: 'Independent, evidence-led news and public-interest reporting focused on democracy, constitutional rights, corruption, government accountability, and human rights.',

  organization: {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': 'https://dgno.us/#organization',
    name: 'DGNO',
    url: 'https://dgno.us/',
    logo: {
      '@type': 'ImageObject',
      url: 'https://dgno.us/logo.png',
      width: 500,
      height: 500,
    },
    description: 'Independent, evidence-led, pro-democracy news and public-interest reporting.',
    foundingDate: '2025-08',
    sameAs: [
      'https://www.tiktok.com/@dgnonews',
      'https://www.instagram.com/dgnonews',
    ],
  },

  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://dgno.us/#website',
    url: 'https://dgno.us/',
    name: 'DGNO',
    publisher: {'@id': 'https://dgno.us/#organization'},
    inLanguage: 'en-US',
  },
} as const;

interface TimestampLike {
  toDate: () => Date;
}

function dateFrom(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (value && typeof value === 'object' && 'toDate' in value &&
      typeof (value as TimestampLike).toDate === 'function') {
    return dateFrom((value as TimestampLike).toDate());
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function normalizeArticleSlug(value: string | undefined): string {
  if (!value) return '';
  const parts = value
    .replace(/^https?:\/\/[^/]+/i, '')
    .split(/[/?#]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const articleIndex = parts.lastIndexOf('article');
  const relevant = articleIndex >= 0 ? parts.slice(articleIndex + 1) : parts;
  const dated = relevant.length >= 4 &&
    /^\d{4}$/.test(relevant[0]) &&
    /^\d{2}$/.test(relevant[1]) &&
    /^\d{2}$/.test(relevant[2]);
  const candidate = dated ? relevant.slice(3).join('-') :
    relevant[relevant.length - 1] || '';
  try {
    return decodeURIComponent(candidate);
  } catch {
    return '';
  }
}

export function buildArticlePath(slugValue: string, publishedAt: unknown): string {
  const slug = normalizeArticleSlug(slugValue);
  if (!slug) return '/article/';

  const date = dateFrom(publishedAt);
  if (!date) return `/article/${encodeURIComponent(slug)}`;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SEO_CONFIG.publicationTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || '';

  return `/article/${part('year')}/${part('month')}/${part('day')}/${encodeURIComponent(slug)}`;
}

export function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, `${SEO_CONFIG.siteUrl}/`).toString();
}

export function inferImageMimeType(imageUrl: string): string | null {
  try {
    const path = decodeURIComponent(new URL(imageUrl, `${SEO_CONFIG.siteUrl}/`).pathname)
      .toLowerCase();
    if (path.endsWith('.png')) return 'image/png';
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
    if (path.endsWith('.webp')) return 'image/webp';
    if (path.endsWith('.gif')) return 'image/gif';
  } catch {
    return null;
  }
  return null;
}

export function buildKeywords(articleTags: readonly string[] = []): string {
  return [...new Set([...articleTags, ...SEO_CONFIG.coreKeywords])].join(', ');
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  const pageUrl = items[items.length - 1]?.url || SEO_CONFIG.siteUrl;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
