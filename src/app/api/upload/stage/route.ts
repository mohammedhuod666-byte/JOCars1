import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { prepareDocument } from '@/lib/media/doc-upload';
import { cloudinary } from '@/lib/media/cloudinary';
import { signUploadRef, isUploadRefKind, type UploadRefKind } from '@/lib/media/upload-token';
import { MAX_SINGLE_FILE_BYTES, formatMB, singleFileTooLargeMessage } from '@/lib/media/upload-limits';

/**
 * POST /api/upload/stage
 *
 * Uploads ONE asset — gallery image OR official document — and returns
 * a signed reference (documents) or the CDN URL (images). The publish
 * endpoint then carries only references/URLs instead of file bytes.
 *
 * ARCHITECTURE FIX
 * The platform caps a route-handler request body at 4.5MB (measured).
 * Gallery images are bounded after client compression (~200KB x 10 ≈ 2MB),
 * but a scanned multi-page inspection PDF is routinely larger and cannot
 * be compressed in the browser without corrupting it. Sending documents
 * in their own request removes them from the publish body entirely, so
 * the aggregate ceiling stops being a thing a seller can hit.
 *
 * Gallery images ALSO use this route now — previously they were sent
 * inside the publish multipart body, which meant any ad with ~10+ photos
 * could cross the 4.5MB edge and die with "تعذر استلام البيانات".
 * Uploading images first (one by one, or in parallel) keeps the publish
 * body to text data + references only — always under the ceiling.
 *
 * Chunked upload is NOT used, and the reason is recorded in
 * src/lib/upload-limits.ts: Cloudinary's chunked API requires every
 * non-final chunk to exceed 5MB, which cannot pass a 4.5MB body limit.
 *
 * WHY A SIGNED REFERENCE (documents only)
 * Returning a bare URL would let the publish call store any URL the
 * client sends, including another seller's document. The reference is an
 * HMAC over (userId, url, kind, expiry), so a seller can only attach
 * files they uploaded, only into the slot they uploaded them for.
 *
 * PRIVACY
 * Documents stored with `type: 'authenticated'`, signed by the server.
 * The plain CDN URL returns 403 for everyone; the only read path is
 * /api/cars/[id]/documents, which mints a short-lived signed URL after
 * an ownership/role check. Gallery images are public by design.
 */

const VALID_KINDS = new Set<string>(['license', 'inspection', 'inspectionExtra', 'serviceRecord', 'gallery']);

/** Upload one asset and return the result the caller needs for publish. */
async function uploadAsset(
  user: { id: string; role: string },
  file: File,
  kind: string,
) {
  const prepared = await prepareDocument(file);

  // For gallery images: upload to the public gallery folder.
  // For documents: upload as authenticated (private) assets.
  const isGallery = kind === 'gallery';
  const folder = isGallery
    ? (user.role === 'DEALER' ? 'jo-cars/dealers' : 'jo-cars/users')
    : 'jo-cars/docs';
  const resourceType = prepared.isPdf ? 'raw' : 'image';
  const uploadType = isGallery ? 'upload' : 'authenticated';

  const up = prepared.isPdf
    ? await cloudinary.uploader.upload(
        `data:application/pdf;base64,${prepared.buffer.toString('base64')}`,
        { folder, resource_type: resourceType, type: uploadType },
      )
    : await cloudinary.uploader.upload(
        `data:${prepared.mime};base64,${prepared.buffer.toString('base64')}`,
        { folder, resource_type: resourceType, type: uploadType },
      );

  if (isGallery) {
    // Gallery images: return the CDN URL directly (public asset).
    return { url: up.secure_url, publicId: up.public_id, bytes: up.bytes ?? prepared.bytes, format: up.format ?? prepared.ext };
  }

  // Documents: return signed reference + private URL (for draft restore).
  const ref = signUploadRef(user.id, up.secure_url, kind as UploadRefKind);
  return { url: up.secure_url, ref, bytes: up.bytes ?? prepared.bytes, format: up.format ?? prepared.ext };
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user) return unauthorizedResponse();

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
  if (!VALID_KINDS.has(kind) || (!isUploadRefKind(kind as UploadRefKind) && kind !== 'gallery')) {
    return errorResponse('نوع المستند غير معروف', 400);
  }

  const file = formData.get('file');
  const isRealFile =
    !!file && typeof file !== 'string' && typeof (file as File).size === 'number' && (file as File).size > 0;
  if (!isRealFile) return errorResponse('لم يتم إرسال أي ملف', 400);

  const staged = file as File;

  if (staged.size > MAX_SINGLE_FILE_BYTES) {
    const label = kind === 'license' ? 'صورة الرخصة'
      : kind === 'serviceRecord' ? 'سجل الصيانة'
      : kind === 'inspection' ? 'تقرير الفحص'
      : kind === 'inspectionExtra' ? 'صفحة الفحص'
      : 'صورة السيارة';
    return errorResponse(singleFileTooLargeMessage(staged.size, label), 413);
  }

  let prepared;
  try {
    prepared = await prepareDocument(staged, { maxBytes: MAX_SINGLE_FILE_BYTES });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'تعذر التحقق من الملف';
    const safe = /[\u0600-\u06FF]/.test(msg) ? msg : 'تعذر قراءة الملف — تأكد أنه صورة أو PDF سليم';
    return errorResponse(safe, 400);
  }

  const hasCloudinary = !!(
    process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
    && !process.env.CLOUDINARY_API_KEY.startsWith('your-')
  );

  try {
    if (!hasCloudinary) {
      return errorResponse(
        'تخزين الملفات غير مُعدّ على هذا الخادم — تعذر رفع الملف الآن',
        503,
      );
    }

    const result = await uploadAsset(user, staged, kind);

    if (kind === 'gallery') {
      return successResponse({
        url: result.url,
        publicId: result.publicId,
        bytes: result.bytes,
        format: result.format,
      });
    }

    const ref = result.ref as string;
    return successResponse({
      url: result.url,
      ref,
      kind,
      bytes: result.bytes,
      format: result.format,
    });
  } catch (err) {
    console.error('[upload/stage] failed:', err);
    return errorResponse('تعذر رفع الملف على خادم التخزين — أعد المحاولة بعد قليل', 502);
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