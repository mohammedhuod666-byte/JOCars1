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

/**
 * Picks an expressive local automotive cover image matching the article's title/category
 * whenever an article does not have a working external cover image.
 */
export function getExpressiveNewsImage(
  title?: string | null,
  category?: string | null,
  existingImage?: string | null
): string {
  if (existingImage && existingImage.trim()) {
    return proxyNewsImage(existingImage);
  }
  const text = `${title || ''} ${category || ''}`.toLowerCase();
  if (/كهرب|ev|شحن|بطاري|byd|تيسلا|tesla|ioniq|id\./i.test(text)) {
    return '/news-covers/ev.svg';
  }
  if (/fuel|بنزين|ديزل|وقود|محروقات|تسعيرة/i.test(text)) {
    return '/news-covers/fuel.svg';
  }
  if (/customs|جمرك|جمارك|ضريب|ترخيص|منطقة حرة|رسوم/i.test(text)) {
    return '/news-covers/customs.svg';
  }
  if (/tips|صيانة|نصائح|زيت|فحص|عطل|ميكانيك|كفرات|إطارات/i.test(text)) {
    return '/news-covers/tips.svg';
  }
  if (/review|مراجع|تجربة|إطلاق|كشف|موديل|جديد/i.test(text)) {
    return '/news-covers/review.svg';
  }
  return '/hero-porsche.jpg';
}
