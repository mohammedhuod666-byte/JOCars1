// Zero-dependency image URL helpers — safe to import in client components
// (unlike src/lib/cloudinary.ts, which bundles the server SDK + secrets).

/**
 * Shrink any res.cloudinary.com delivery URL to a thumbnail variant by
 * injecting a transform segment after `/upload/`. Non-Cloudinary URLs
 * (and URLs that already carry a transform) pass through untouched, so
 * this is safe for legacy rows.
 */
export function cloudinaryThumb(url: string, width = 640): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Already transformed (w_/h_/c_/f_/q_ right after /upload/) → leave as-is.
  if (/\/upload\/[a-z]+_[^/]*\//.test(url)) return url;
  return url.replace(
    /\/upload\/(v\d+\/)?/,
    (_m, v) => `/upload/w_${width},f_auto,q_auto/${v || ''}`
  );
}
