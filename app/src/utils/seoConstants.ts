// Centralized SEO constants for consistency across the site
export const SEO_CONFIG = {
  siteName: 'DGNO',
  siteUrl: 'https://dgno.us',

  // Core keywords to be included on every page
  coreKeywords: [
    'data-driven news',
    'unbiased news',
    'pro-democracy news',
    'constitutional news',
    'pro-human rights news',
    'independent news',
    'anti-corruption news',
    'investigative journalism',
    'government accountability',
    'transparency'
  ],

  // Default meta information
  defaultTitle: 'DGNO - Data-Driven, Independent, Pro-Democracy News',
  defaultDescription: 'Data-driven, unbiased, and independent news coverage. Pro-democracy and anti-corruption journalism backed by the Constitution. Covering politics, human rights, investigations, and more.',

  // Organization structured data
  organization: {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    'name': 'DGNO',
    'url': 'https://dgno.us',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://dgno.us/favicon.png',
      'width': 512,
      'height': 512
    },
    'description': 'Data-driven, independent news organization dedicated to pro-democracy, anti-corruption journalism',
    'foundingDate': '2025-08',
    'sameAs': [
      // Add social media profiles
      'https://www.tiktok.com/@dgnonews',
      'https://www.instagram.com/dgnonews'
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'Editorial',
      'url': 'https://dgno.us/about'
    }
  }
};

// Helper to combine article tags with core keywords
export function buildKeywords(articleTags: string[] = []): string {
  return [...articleTags, ...SEO_CONFIG.coreKeywords].join(', ');
}

// Helper to build breadcrumb schema
export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };
}
