/**
 * Route news article images through our same-origin proxy so external news
 * hosts (blocked by CSP img-src) still render. Same-origin, data:, blob:,
 * and Cloudinary URLs pass through untouched.
 */
export function proxyNewsImage(url: string | null | undefined): string {
  if (!url) return '';
  if (
    url.startsWith('/') ||
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.includes('/api/news-image?')
  ) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return url;
    if (parsed.hostname.includes('cloudinary.com')) return url;
    return `/api/news-image?url=${encodeURIComponent(url)}`;
  } catch {
    return url;
  }
}
