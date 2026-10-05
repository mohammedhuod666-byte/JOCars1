import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { prepareDocument } from '@/lib/doc-upload';
import { cloudinary } from '@/lib/cloudinary';
import { signUploadRef, isUploadRefKind, type UploadRefKind } from '@/lib/upload-token';
import { MAX_SINGLE_FILE_BYTES, formatMB, singleFileTooLargeMessage } from '@/lib/upload-limits';

/**
 * POST /api/upload/stage
 *
 * Uploads ONE official document and returns a signed reference. The publish
 * endpoint then receives that reference instead of the file bytes.
 *
 * WHY THIS EXISTS
 * The platform caps a route-handler request body at 4.5MB (measured — see
 * src/lib/upload-limits.ts). Gallery images are bounded after client
 * compression (~200KB x 10 ≈ 2MB), but a scanned multi-page inspection PDF is
 * routinely larger and cannot be compressed in a browser without corrupting it.
 * Sending documents in their own request removes them from the publish body
 * entirely, so the aggregate ceiling stops being a thing a seller can hit.
 *
 * Chunked upload is NOT used, and the reason is worth recording: Cloudinary's
 * chunked API requires every non-final chunk to exceed 5MB (verified — it
 * answers "All parts except EOF-chunk must be larger than 5mb"), which cannot
 * pass a 4.5MB body limit. See src/lib/upload-limits.ts.
 *
 * WHY A SIGNED REFERENCE
 * Returning a bare URL would let the publish call store any URL the client
 * sends, including another seller's document. The reference is an HMAC over
 * (userId, url, kind, expiry), so a seller can only attach files they uploaded,
 * only into the slot they uploaded them for. See src/lib/upload-token.ts.
 *
 * PRIVACY
 * Stored with `type: 'authenticated'`, signed by the server. The plain CDN URL
 * returns 403 for everyone; the only read path is /api/cars/[id]/documents,
 * which mints a short-lived signed URL after an ownership/role check.
 */

const VALID_KINDS = new Set<string>(['license', 'inspection', 'inspectionExtra', 'serviceRecord']);

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await authenticateRequest(request);
  } catch {
    return unauthorizedResponse();
  }
  if (!user) return unauthorizedResponse();
  if (user.canPost === false || user.banStatus) return errorResponse('تم إيقاف النشر لحسابك', 403);

  // Content-Length first: a file that cannot possibly fit should be rejected
  // without buffering it. The platform would answer an oversized request with an
  // HTML 413 that this handler never sees, so we also enforce after parsing.
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > MAX_SINGLE_FILE_BYTES + 1024 * 1024) {
    return errorResponse(
      singleFileTooLargeMessage(Math.max(0, declared - 512 * 1024), 'المستند'),
      413,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(
      'تعذر استلام المستند — الحجم يتجاوز الحد أو انقطع الاتصال أثناء الرفع.',
      413,
    );
  }

  const kind = String(formData.get('kind') || '');
  if (!VALID_KINDS.has(kind) || !isUploadRefKind(kind)) {
    return errorResponse('نوع المستند غير معروف', 400);
  }

  const file = formData.get('file');
  const isRealFile =
    !!file && typeof file !== 'string' && typeof (file as File).size === 'number' && (file as File).size > 0;
  if (!isRealFile) return errorResponse('لم يتم إرسال أي مستند', 400);

  const staged = file as File;

  // The single-file ceiling. An image document was already compressed client-side
  // to ~1600px, so anything still over this limit is a large PDF — which is the
  // case we must explain rather than silently truncate or reject generically.
  if (staged.size > MAX_SINGLE_FILE_BYTES) {
    return errorResponse(
      singleFileTooLargeMessage(staged.size, kind === 'license' ? 'صورة الرخصة'
        : kind === 'serviceRecord' ? 'سجل الصيانة' : 'تقرير الفحص'),
      413,
    );
  }

  let prepared;
  try {
    // Full validation: MIME allowlist, magic bytes, PDF structural checks
    // (/javascript, /launch, /embeddedfile rejection), then WebP compression for
    // image documents. The extension comes from what we DETECTED, never from the
    // user-supplied filename.
    prepared = await prepareDocument(staged, { maxBytes: MAX_SINGLE_FILE_BYTES });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'تعذر التحقق من المستند';
    // Our own validators speak Arabic and are actionable; anything else is an
    // internal failure and must not reach the seller.
    const safe = /[\u0600-\u06FF]/.test(msg) ? msg : 'تعذر قراءة المستند — تأكد أنه صورة أو PDF سليم';
    return errorResponse(safe, 400);
  }

  const hasCloudinary = !!(
    process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
    && !process.env.CLOUDINARY_API_KEY.startsWith('your-')
  );

  try {
    if (!hasCloudinary) {
      // No Cloudinary configured: tell the seller rather than storing a document
      // somewhere that will not be readable. The local disk fallback in the
      // publish route writes to a per-request temp path that no longer exists by
      // the time the publish call arrives, so silently "succeeding" here would
      // produce a listing with a broken document link.
      return errorResponse(
        'تخزين المستندات غير مُعدّ على هذا الخادم — تعذر رفع المستند الآن',
        503,
      );
    }

    // PDFs go up as resource_type 'raw' so Cloudinary stores and serves them as
    // documents rather than trying to process them as images.
    const up = prepared.isPdf
      ? await cloudinary.uploader.upload(
        `data:application/pdf;base64,${prepared.buffer.toString('base64')}`,
        { folder: 'jo-cars/docs', resource_type: 'raw', type: 'authenticated' },
      )
      : await cloudinary.uploader.upload(
        `data:${prepared.mime};base64,${prepared.buffer.toString('base64')}`,
        { folder: 'jo-cars/docs', resource_type: 'image', type: 'authenticated' },
      );

    const url = up.secure_url;
    if (!url) return errorResponse('تعذر رفع المستند — لم يُرجع خادم التخزين رابطاً', 502);

    const ref = signUploadRef(user.id, url, kind as UploadRefKind);

    return successResponse({
      // Both are returned: the wizard needs the URL for its private local
      // preview, and the publish call carries `ref` as the only trusted input.
      url,
      ref,
      kind,
      bytes: up.bytes ?? prepared.bytes,
      format: up.format ?? prepared.ext,
    });
  } catch (err) {
    console.error('[upload/stage] failed:', err);
    return errorResponse('تعذر رفع المستند على خادم التخزين — أعد المحاولة بعد قليل', 502);
  }
}

/** Client-facing limits so the UI never offers a choice that cannot be stored. */
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user) return unauthorizedResponse();
  return successResponse({
    maxFileBytes: MAX_SINGLE_FILE_BYTES,
    maxFileMB: formatMB(MAX_SINGLE_FILE_BYTES),
    accepted: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  });
}
