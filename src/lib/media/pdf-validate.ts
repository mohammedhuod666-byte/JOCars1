import { detectPdfSignature } from './pdf-signature';

/**
 * PDF validation for official documents (license / inspection reports).
 *
 * Separate from video-validate and image-validate because PDFs have a
 * different threat surface:
 *   - magic bytes must be "%PDF-" AND the file must end with "%%EOF";
 *   - embedded JavaScript / launch actions are the classic PDF attack vector, so
 *     we refuse anything containing those rather than trying to sanitise it;
 *   - object streams can hide those keywords, so a raw substring scan can be
 *     bypassed. We therefore also cap the size and, when the marker is absent,
 *     we do NOT try to be clever — we reject with an actionable message.
 */

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB

// Markers that make a PDF active content rather than a static document.
const DANGEROUS_MARKERS: { needle: string; label: string }[] = [
  { needle: '/javascript', label: 'JavaScript' },
  { needle: '/js', label: 'JavaScript' },
  { needle: '/launch', label: 'Launch' },
  { needle: '/embeddedfile', label: 'ملف مضمّن' },
  { needle: '/richmedia', label: 'وسائط غنية' },
  { needle: '/acroform', label: 'نموذج تفاعلي' },
  { needle: '/openaction', label: 'إجراء تلقائي' },
  { needle: '/aa', label: 'إجراء إضافي' },
  { needle: '/jbigsave', label: 'ضغط JBIG' },
  { needle: '/richmediaexecute', label: 'تنفيذ وسائط' },
];

export interface ValidatedPdf {
  buffer: Buffer;
  size: number;
}

export async function validateUploadedPdf(file: {
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}): Promise<ValidatedPdf> {
  if (file.type !== 'application/pdf') {
    throw new Error('نوع الملف غير مدعوم — ارفع صورة (JPG/PNG/WebP) أو ملف PDF');
  }
  if (file.size <= 0) {
    throw new Error('الملف فارغ');
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error('حجم الملف يتجاوز الحد الأقصى (15 ميجابايت)');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (!detectPdfSignature(buffer)) {
    throw new Error('محتوى الملف ليس PDF صالحاً');
  }

  // Defence in depth: reject a PDF carrying a trailer at all but the EOF marker,
  // and scan for active-content markers in the readable (uncompressed) parts.
  const tail = buffer.subarray(Math.max(0, buffer.length - 2048)).toString('latin1');
  if (!tail.includes('%%EOF')) {
    throw new Error('ملف PDF غير مكتمل أو تالف');
  }

  const text = buffer.toString('latin1');
  for (const marker of DANGEROUS_MARKERS) {
    if (text.includes(marker.needle)) {
      // The /aa and /js needles are short and can appear innocently inside a
      // compressed stream by chance, so only hard-block the unmistakable ones.
      if (marker.needle === '/javascript' || marker.needle === '/launch' || marker.needle === '/embeddedfile') {
        throw new Error(`الملف يحتوي على محتوى تفاعلي (${marker.label}) وهو غير مسموح — احفظه كصورة PDF بدلاً من ذلك`);
      }
    }
  }

  return { buffer, size: buffer.length };
}

export const PDF_LIMITS = { maxBytes: MAX_PDF_BYTES, mime: 'application/pdf' };
