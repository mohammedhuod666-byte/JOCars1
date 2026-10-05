'use client';

/**
 * Client-side image compression (browser canvas → WebP).
 *
 * Why this exists at all: the hosting platform caps a route-handler request
 * body at 4.5MB (measured — see src/lib/upload-limits.ts), and the publish
 * endpoint is multipart. Ten 1600px WebP photos at q0.82 land at ~350KB each,
 * which is 3.5MB for the gallery alone, before the two mandatory documents and
 * any PDF — so a perfectly reasonable ad crossed the ceiling and died with a
 * misleading "تعذر استلام البيانات".
 *
 * Two profiles, because the two kinds of image have different requirements:
 *   - GALLERY: viewed in a carousel and a card thumbnail. 1280px is already
 *     larger than any card renders, so the extra pixels were pure payload.
 *   - DOCUMENT: a license plate or inspection report must stay legible when the
 *     owner opens it full-screen to check details, so it keeps more resolution.
 */

const GALLERY_MAX_DIM = 1280;
const GALLERY_QUALITY = 0.78;
const DOC_MAX_DIM = 1600;
const DOC_QUALITY = 0.82;

type Profile = { maxDim: number; quality: number };

async function compressWith(
  file: File,
  { maxDim, quality }: Profile,
): Promise<File> {
  // GIFs pass through untouched (canvas would flatten the animation) and small
  // files are already efficient.
  if (file.type === 'image/gif' || file.size < 300 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    // No work needed and already efficient.
    if (scale === 1 && (file.type === 'image/webp' || file.type === 'image/jpeg') && file.size < 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality),
    );
    if (!blob) return file;
    // Never inflate: keep the original if WebP came out bigger.
    if (blob.size >= file.size) return file;
    const base = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${base}.webp`, { type: 'image/webp' });
  } catch {
    return file; // compression is best-effort; server validates anyway
  }
}

export async function compressImageClient(file: File): Promise<File> {
  return compressWith(file, { maxDim: GALLERY_MAX_DIM, quality: GALLERY_QUALITY });
}

/**
 * Documents use a higher-fidelity profile. Kept as a separate export (not a
 * flag on the gallery function) so a caller cannot silently downgrade a license
 * photo to thumbnail resolution.
 */
export async function compressDocumentClient(file: File): Promise<File> {
  return compressWith(file, { maxDim: DOC_MAX_DIM, quality: DOC_QUALITY });
}

export async function compressImagesClient(files: File[]): Promise<{ files: File[]; savedMB: number }> {
  const before = files.reduce((n, f) => n + f.size, 0);
  const out = await Promise.all(files.map(compressImageClient));
  const after = out.reduce((n, f) => n + f.size, 0);
  return { files: out, savedMB: (before - after) / 1024 / 1024 };
}

/** Document variant of {@link compressImagesClient}. */
export async function compressDocsClient(files: File[]): Promise<{ files: File[]; savedMB: number }> {
  const before = files.reduce((n, f) => n + f.size, 0);
  const out = await Promise.all(files.map(compressDocumentClient));
  const after = out.reduce((n, f) => n + f.size, 0);
  return { files: out, savedMB: (before - after) / 1024 / 1024 };
}
