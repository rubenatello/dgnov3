import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export default function SEOHead({
  title = 'DGNO - Independent, Pro-Democracy and Anti-Corruption News',
  description = 'Independent journalism focused on democracy, anti-corruption investigations, and accountability. Breaking news, in-depth analysis, and tracker data on government transparency.',
  image = 'https://dgno.us/og-image.png',
  url = 'https://dgno.us/',
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = []
}: SEOHeadProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Helper function to update meta tag
    const updateMeta = (selector: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (element) {
        element.content = content;
      } else {
        element = document.createElement('meta');
        if (selector.includes('property=')) {
          element.setAttribute('property', selector.match(/"([^"]*)"/)![1]);
        } else if (selector.includes('name=')) {
          element.setAttribute('name', selector.match(/"([^"]*)"/)![1]);
        }
        element.content = content;
        document.head.appendChild(element);
      }
    };
    
    // Helper function to update link tag
    const updateLink = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (element) {
        element.href = href;
      } else {
        element = document.createElement('link');
        element.rel = rel;
        element.href = href;
        document.head.appendChild(element);
      }
    };
    
    // Update basic meta tags
    updateMeta('meta[name="title"]', title);
    updateMeta('meta[name="description"]', description);
    
    // Update keywords if tags are provided
    if (tags.length > 0) {
      const keywords = tags.join(', ') + ', independent news, democracy, anti-corruption, government accountability';
      updateMeta('meta[name="keywords"]', keywords);
    }
    
    // Update Open Graph tags
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:image"]', image);
    updateMeta('meta[property="og:url"]', url);
    updateMeta('meta[property="og:type"]', type);
    
    // Update Twitter tags
    updateMeta('meta[property="twitter:title"]', title);
    updateMeta('meta[property="twitter:description"]', description);
    updateMeta('meta[property="twitter:image"]', image);
    updateMeta('meta[property="twitter:url"]', url);
    
    // Article-specific meta tags
    if (type === 'article') {
      if (publishedTime) {
        updateMeta('meta[property="article:published_time"]', publishedTime);
      }
      if (modifiedTime) {
        updateMeta('meta[property="article:modified_time"]', modifiedTime);
      }
      if (author) {
        updateMeta('meta[property="article:author"]', author);
      }
      if (section) {
        updateMeta('meta[property="article:section"]', section);
      }
      if (tags.length > 0) {
        // Remove existing article:tag meta tags
        document.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove());
        // Add new ones
        tags.forEach(tag => {
          const tagMeta = document.createElement('meta');
          tagMeta.setAttribute('property', 'article:tag');
          tagMeta.content = tag;
          document.head.appendChild(tagMeta);
        });
      }
    }
    
    // Update canonical URL
    updateLink('canonical', url);
    
    // Add JSON-LD structured data for articles
    if (type === 'article') {
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "description": description,
        "image": [image],
        "datePublished": publishedTime,
        "dateModified": modifiedTime || publishedTime,
        "author": {
          "@type": "Person",
          "name": author || "DGNO Editorial Team"
        },
        "publisher": {
          "@type": "Organization",
          "name": "DGNO",
          "url": "https://dgno.us",
          "logo": {
            "@type": "ImageObject",
            "url": "https://dgno.us/og-image.png"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": url
        },
        "articleSection": section,
        "keywords": tags.join(', ')
      };
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
    
  }, [title, description, image, url, type, publishedTime, modifiedTime, author, section, tags]);
  
  return null; // This component doesn't render anything
}