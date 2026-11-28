import { validateUploadedImage } from './image-validate';
import { validateUploadedPdf } from './pdf-validate';

/**
 * Upload helper for the three document types in the wizard.
 *
 * Why one helper for all three:
 *   - they share the same privacy model (authenticated storage), the same
 *     accept-list intent, and the same "images OR a PDF" decision, so keeping
 *     them apart would guarantee drift;
 *   - it lets the server treat "one image or one PDF" identically for license,
 *     inspection and service record.
 *
 * PDF support is bounded on purpose: a report may be a scan (image) or a real
 * PDF. PDFs are validated and then stored AS-IS (no data-URI embedding), which
 * is why `cloudinary.uploader.upload` is used with the raw buffer below.
 */
export type DocKind = 'license' | 'inspection' | 'service';

export interface PreparedDoc {
  buffer: Buffer;
  mime: string;
  /** Cloudinary-friendly extension derived from what we DETECTED, never from the user filename. */
  ext: string;
  isPdf: boolean;
  bytes: number;
}

const ACCEPTED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
]);

export async function prepareDocument(
  file: File,
  opts?: { maxBytes?: number },
): Promise<PreparedDoc> {
  const maxBytes = opts?.maxBytes ?? 15 * 1024 * 1024;

  if (!ACCEPTED_MIME.has(file.type)) {
    throw new Error('نوع الملف غير مدعوم — JPG أو PNG أو WebP أو PDF');
  }
  if (file.size <= 0) throw new Error('الملف فارغ');
  if (file.size > maxBytes) {
    throw new Error(`حجم الملف يتجاوز الحد الأقصى (${Math.round(maxBytes / 1024 / 1024)} ميجابايت)`);
  }

  if (file.type === 'application/pdf') {
    const { buffer } = await validateUploadedPdf(file);
    return { buffer, mime: 'application/pdf', ext: 'pdf', isPdf: true, bytes: buffer.length };
  }

  // Reuses the existing image validator: MIME allowlist, magic bytes, min
  // dimensions. Rejected 1x1 placeholders and renamed executables stop here.
  const { buffer, ext } = await validateUploadedImage(file);
  const { compressToWebP } = await import('./image-compress');
  if (file.type === 'image/gif') {
    return { buffer, mime: file.type, ext, isPdf: false, bytes: buffer.length };
  }
  const { buffer: out } = await compressToWebP(buffer, file.type);
  // compressToWebP can pass the original through, so keep the real extension.
  const finalBuf = out && !out.equals(buffer) ? out : buffer;
  const finalExt = finalBuf === out && !out.equals(buffer) ? 'webp' : ext;
  return {
    buffer: finalBuf,
    mime: finalExt === 'webp' ? 'image/webp' : file.type,
    ext: finalExt,
    isPdf: false,
    bytes: finalBuf.length,
  };
}
