import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Article } from '../types/models';

/**
 * Generate an XML sitemap for all published articles
 * This should be called periodically or on-demand to update the sitemap
 */
export async function generateSitemap(): Promise<string> {
  const articlesRef = collection(db, 'articles');
  const q = query(
    articlesRef,
    where('status', '==', 'published'),
    where('isActive', '==', true)
  );

  const snapshot = await getDocs(q);
  const articles = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Article));

  // Build XML sitemap
  const baseUrl = 'https://dgno.us';
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add homepage
  sitemap += '  <url>\n';
  sitemap += `    <loc>${baseUrl}/</loc>\n`;
  sitemap += `    <changefreq>daily</changefreq>\n`;
  sitemap += `    <priority>1.0</priority>\n`;
  sitemap += '  </url>\n';
  
  // Add article pages
  for (const article of articles) {
    if (!article.slug) continue;
    
    const url = `${baseUrl}/article/${article.slug}`;
    const lastmod = article.lastUpdatedAt 
      ? new Date(article.lastUpdatedAt.toMillis()).toISOString()
      : new Date().toISOString();
    
    sitemap += '  <url>\n';
    sitemap += `    <loc>${url}</loc>\n`;
    sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    sitemap += `    <priority>0.8</priority>\n`;
    sitemap += '  </url>\n';
  }
  
  // Add static pages
  const staticPages = [
    { path: '/about', priority: '0.7' },
    { path: '/privacy', priority: '0.5' },
    { path: '/trackers', priority: '0.8' },
    { path: '/reports', priority: '0.8' }
  ];
  
  for (const page of staticPages) {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}${page.path}</loc>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <priority>${page.priority}</priority>\n`;
    sitemap += '  </url>\n';
  }
  
  sitemap += '</urlset>';
  
  return sitemap;
}

/**
 * Download the sitemap as an XML file
 * Call this function from your admin panel to generate and download sitemap
 */
export async function downloadSitemap(): Promise<void> {
  const sitemapXml = await generateSitemap();
  const blob = new Blob([sitemapXml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sitemap.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
