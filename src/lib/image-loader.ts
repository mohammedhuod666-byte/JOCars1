/**
 * Global next/image loader.
 *
 * Locally stored uploads (/uploads/*) are already compressed at upload time
 * (max 1600px, WebP/JPEG) and served with immutable cache headers by
 * server.js — routing them through the on-demand optimizer adds a fragile
 * internal-fetch hop that intermittently 400s ("received null") after long
 * uptimes. Serve them directly; keep the optimizer for remote (CDN) URLs.
 */
export default function joCarsImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src || src.startsWith('/uploads/') || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}
