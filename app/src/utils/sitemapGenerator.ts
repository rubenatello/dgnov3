/**
 * Fetch the authoritative server-generated sitemap. Keeping the admin download
 * on the same endpoint prevents canonical or last-modified logic from drifting
 * between the browser and Firebase Functions.
 */
export async function generateSitemap(): Promise<string> {
  const response = await fetch('/sitemap.xml', {
    headers: { Accept: 'application/xml' },
    credentials: 'same-origin',
  });
  if (!response.ok) {
    throw new Error(`Sitemap endpoint returned ${response.status}.`);
  }
  return response.text();
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
