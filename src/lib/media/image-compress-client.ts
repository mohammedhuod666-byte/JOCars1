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

/**
 * Quality ladder, best first. `fitGalleryToBudget` walks it and stops at the first
 * rung whose total fits.
 *
 * The rungs exist because the wizard allows up to 20 photos while a single
 * request body cannot exceed ~3.8MB (see src/lib/upload-limits.ts). A fixed
 * 1280px/q0.78 profile produced a 20-photo body of 7.7MB, so every such seller
 * was rejected — and the two behaviours contradicted each other: the UI promised
 * 20 photos while the guard refused them.
 *
 * The sizes below are MEASURED, not assumed: 20 noisy 4000x3000 phone photos
 * encoded in Chrome, per-image WebP bytes.
 *
 *   1280px @0.78 -> 395KB   7.71MB for 20   (does not fit)
 *   1200px @0.72 -> 308KB   6.01MB
 *   1024px @0.66 -> 199KB   3.89MB          (just over)
 *    900px @0.60 -> 159KB   3.10MB          (fits 20 with margin)
 *    800px @0.55 -> 139KB   2.71MB
 *
 * An earlier note here claimed ~180KB at the top rung. That was wrong by 2.2x,
 * and the mistake was invisible because the end-to-end test used synthetic
 * gradient images that compress far better than real photographs. The bug it
 hid was larger than the reported one: at 395KB per photo even a TEN-photo
 * gallery of real photos overshoots the budget, so the failure was never really
 * about 20.
 *
 * Two extra rungs below the measured sweet spot are kept as headroom for
 * noisier scenes (a night shot, a gravel road) that encode worse than the test
 * set. The ladder stops at the first rung that fits, so they cost nothing when
 * the higher rungs suffice.
 */
const LADDER: Profile[] = [
  { maxDim: 1280, quality: 0.78 },
  { maxDim: 1200, quality: 0.72 },
  { maxDim: 1024, quality: 0.66 },
  { maxDim: 900, quality: 0.60 },
  { maxDim: 800, quality: 0.55 },
  { maxDim: 720, quality: 0.50 },
  { maxDim: 640, quality: 0.45 },
];

const sum = (files: File[]) => files.reduce((n, f) => n + (f.size || 0), 0);

export interface FitResult {
  files: File[];
  /** Rung index actually used; -1 means the inputs already fitted untouched. */
  rung: number;
  totalBytes: number;
}

/**
 * Compresses a gallery so the whole set fits `budgetBytes`.
 *
 * Deterministic and dependency-free: no guesswork, no server round-trip, no
 * upload-then-fail cycle. Worst case it returns the lowest rung without fitting,
 * and the caller's honest guard still fires — the goal is that it almost never
 * has to, not that it can silently truncate the seller's gallery.
 */
export async function fitGalleryToBudget(
  files: File[],
  budgetBytes: number,
): Promise<FitResult> {
  if (!files.length) return { files, rung: -1, totalBytes: 0 };

  const originals = sum(files);
  if (originals <= budgetBytes) {
    // Still normalise: an already-small PNG re-encoded to WebP is smaller and
    // keeps the upload homogeneous.
    const normalised = await compressImagesClient(files);
    if (sum(normalised.files) <= budgetBytes) {
      return { files: normalised.files, rung: -1, totalBytes: sum(normalised.files) };
    }
  }

  let best: FitResult = { files, rung: -1, totalBytes: originals };
  for (let i = 0; i < LADDER.length; i++) {
    const profile = LADDER[i];
    // Recompress from the ORIGINAL each rung, never from the previous rung:
    // re-encoding an already-reduced WebP compounds artefacts.
    const out = await Promise.all(files.map((f) => compressWith(f, profile)));
    const total = sum(out);
    if (i === 0 && total > originals) {
      // Compression inflated everything (e.g. already-optimised files); there is
      // nothing to gain by walking the rest of the ladder.
      return { files, rung: -1, totalBytes: originals };
    }
    if (total <= budgetBytes) return { files: out, rung: i, totalBytes: total };
    best = { files: out, rung: i, totalBytes: total };
  }
  return best;
}

/** Document variant of {@link compressImagesClient}. */
export async function compressDocsClient(files: File[]): Promise<{ files: File[]; savedMB: number }> {
  const before = files.reduce((n, f) => n + f.size, 0);
  const out = await Promise.all(files.map(compressDocumentClient));
  const after = out.reduce((n, f) => n + f.size, 0);
  return { files: out, savedMB: (before - after) / 1024 / 1024 };
}
