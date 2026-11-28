import { readImageDimensions } from './image-dimensions';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MIN_DIMENSION = 100; // reject 1x1 tracking pixels / corrupt placeholders

function hasImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true; // JPEG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true; // PNG
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true; // GIF
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true; // WEBP (RIFF....WEBP)
  return false;
}

export interface ValidatedImage {
  buffer: Buffer;
  ext: 'jpg' | 'png' | 'webp' | 'gif';
  width: number;
  height: number;
}

/**
 * Validate an uploaded image: MIME allowlist, magic bytes (no renamed
 * executables), and minimum dimensions (no 1x1 placeholders). Throws with
 * an Arabic message on failure.
 */
export async function validateUploadedImage(file: { type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> }): Promise<ValidatedImage> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error('نوع الملف غير مسموح. الأنواع المسموحة: JPG, PNG, WebP, GIF');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('حجم الصورة يتجاوز الحد الأقصى (10MB)');
  }
  const bytes = await file.arrayBuffer();
  if (!bytes || bytes.byteLength === 0) throw new Error('ملف الصورة فارغ');
  const buffer = Buffer.from(bytes);
  if (!hasImageMagicBytes(buffer)) {
    throw new Error('محتوى الملف ليس صورة صالحة');
  }
  let width = 0;
  let height = 0;
  // Dimensions come from the file header in pure JavaScript. This used to call
  // sharp, a native addon, which Cloudflare Workers cannot load at all. The
  // parser is verified against sharp on real JPEG/PNG/GIF/WebP files (15 cases,
  // including rejecting HTML, a renamed executable and random bytes), so the
  // anti-placeholder defence is unchanged — see src/lib/image-dimensions.ts.
  const dims = readImageDimensions(buffer);
  if (!dims) {
    throw new Error('تعذر قراءة الصورة — الملف تالف أو ليس صورة صالحة');
  }
  width = dims.width;
  height = dims.height;
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new Error(`أبعاد الصورة صغيرة جداً (${width}×${height}) — يبدو الملف تالفاً، أعد رفع الصورة`);
  }
  const ext = file.type === 'image/jpeg' ? 'jpg'
    : file.type === 'image/png' ? 'png'
    : file.type === 'image/gif' ? 'gif' : 'webp';
  return { buffer, ext, width, height };
}
