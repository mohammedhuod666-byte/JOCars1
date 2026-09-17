import sharp from 'sharp';

const MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;

/**
 * Compress any raster image to an optimized WebP (max 1600px wide).
 * - GIFs are returned untouched (to preserve animation).
 * - Already-small files (<150KB) are returned untouched.
 * - On any failure the original buffer is returned (never breaks uploads).
 */
export async function compressToWebP(input: Buffer, mimeType: string): Promise<{ buffer: Buffer; mime: string; ext: string }> {
  try {
    if (mimeType === 'image/gif') return { buffer: input, mime: mimeType, ext: 'gif' };
    if (input.length < 150 * 1024) return { buffer: input, mime: mimeType, ext: extFromMime(mimeType) };
    if (input.length > 25 * 1024 * 1024) return { buffer: input, mime: mimeType, ext: extFromMime(mimeType) };

    const out = await sharp(input)
      .rotate() // honor EXIF orientation
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // Keep whichever is smaller (never inflate)
    if (out.length >= input.length) return { buffer: input, mime: mimeType, ext: extFromMime(mimeType) };
    return { buffer: out, mime: 'image/webp', ext: 'webp' };
  } catch {
    return { buffer: input, mime: mimeType, ext: extFromMime(mimeType) };
  }
}

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}
