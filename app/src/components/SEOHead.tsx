import { useEffect } from 'react';
import {
  buildKeywords,
  inferImageMimeType,
  SEO_CONFIG,
} from '../utils/seoConstants';

interface SEOHeadProps {
  title?: string;
  headline?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  robots?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: readonly string[];
  includeOrganization?: boolean;
}

const SEO_OWNER = 'seo-head';

function removeMeta(attribute: 'name' | 'property', key: string) {
  document.querySelectorAll(`meta[${attribute}="${key}"]`).forEach((node) => node.remove());
}

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
  articleSpecific = false,
) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
  if (articleSpecific) element.dataset.seoArticle = 'true';
}

function upsertCanonical(href: string) {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
}

function appendOwnedSchema(schemaName: string, value: unknown): HTMLScriptElement {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.seoOwner = SEO_OWNER;
  script.dataset.schema = schemaName;
  script.textContent = JSON.stringify(value).replace(/</g, '\\u003c');
  document.head.appendChild(script);
  return script;
}

function representativeArticleImage(image: string): boolean {
  try {
    const pathname = new URL(image, `${SEO_CONFIG.siteUrl}/`).pathname.toLowerCase();
    return !pathname.endsWith('/favicon.png') && !pathname.endsWith('/logo.png');
  } catch {
    return false;
  }
}

export default function SEOHead({
  title = SEO_CONFIG.defaultTitle,
  headline,
  description = SEO_CONFIG.defaultDescription,
  image = SEO_CONFIG.defaultImage,
  url = `${SEO_CONFIG.siteUrl}/`,
  type = 'website',
  robots = 'index, follow, max-image-preview:large',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  includeOrganization = false,
}: SEOHeadProps) {
  useEffect(() => {
    document.querySelectorAll(`script[data-seo-owner="${SEO_OWNER}"]`)
      .forEach((node) => node.remove());
    document.querySelectorAll('meta[data-seo-article="true"]')
      .forEach((node) => node.remove());
    document.querySelectorAll('script[data-seo-server]')
      .forEach((node) => node.remove());

    // Remove the old non-standard Twitter form before writing name attributes.
    ['card', 'url', 'title', 'description', 'image'].forEach((field) =>
      removeMeta('property', `twitter:${field}`));

    document.title = title;
    upsertMeta('name', 'title', title);
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('name', 'keywords', buildKeywords(tags));

    upsertMeta('property', 'og:site_name', SEO_CONFIG.siteName);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', type);
    removeMeta('property', 'og:image:width');
    removeMeta('property', 'og:image:height');
    removeMeta('property', 'og:image:type');
    const imageType = inferImageMimeType(image);
    if (imageType) upsertMeta('property', 'og:image:type', imageType);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
    upsertMeta('name', 'twitter:url', url);
    upsertCanonical(url);

    const ownedSchemas: HTMLScriptElement[] = [];
    if (type === 'article') {
      if (publishedTime) {
        upsertMeta('property', 'article:published_time', publishedTime, true);
      }
      if (modifiedTime) {
        upsertMeta('property', 'article:modified_time', modifiedTime, true);
      }
      if (author) upsertMeta('property', 'article:author', author, true);
      if (section) upsertMeta('property', 'article:section', section, true);
      tags.forEach((tag) => {
        const tagMeta = document.createElement('meta');
        tagMeta.setAttribute('property', 'article:tag');
        tagMeta.dataset.seoArticle = 'true';
        tagMeta.content = tag;
        document.head.appendChild(tagMeta);
      });

      const articleSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        '@id': `${url}#article`,
        url,
        headline: headline || title.replace(/\s+\|\s+DGNO$/i, ''),
        description,
        mainEntityOfPage: {'@type': 'WebPage', '@id': url},
        publisher: {
          '@type': SEO_CONFIG.organization['@type'],
          '@id': SEO_CONFIG.organization['@id'],
          name: SEO_CONFIG.organization.name,
          url: SEO_CONFIG.organization.url,
          logo: SEO_CONFIG.organization.logo,
        },
        inLanguage: 'en-US',
      };
      if (representativeArticleImage(image)) articleSchema.image = [image];
      if (publishedTime) articleSchema.datePublished = publishedTime;
      if (modifiedTime) articleSchema.dateModified = modifiedTime;
      if (author && author !== 'DGNO Editorial Team') {
        articleSchema.author = {'@type': 'Person', name: author};
      }
      if (section) articleSchema.articleSection = section;
      if (tags.length > 0) articleSchema.keywords = [...tags];
      ownedSchemas.push(appendOwnedSchema('news-article', articleSchema));
    }

    if (includeOrganization &&
      !document.querySelector('script[data-schema="site-identity"]') &&
      !document.querySelector('script[data-schema="organization"]')) {
      ownedSchemas.push(appendOwnedSchema('organization', SEO_CONFIG.organization));
    }

    return () => {
      ownedSchemas.forEach((schema) => schema.remove());
      if (type === 'article') {
        document.querySelectorAll('meta[data-seo-article="true"]')
          .forEach((node) => node.remove());
      }
    };
  }, [
    title,
    headline,
    description,
    image,
    url,
    type,
    robots,
    publishedTime,
    modifiedTime,
    author,
    section,
    tags,
    includeOrganization,
  ]);

  return null;
}
