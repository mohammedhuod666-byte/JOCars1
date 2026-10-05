import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { errorResponse, notFoundResponse, successResponse, unauthorizedResponse } from '@/lib/api';
import { signedDocumentUrl } from '@/lib/car-documents';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * GET /api/cars/[id]/documents?type=license|inspection
 *
 * Returns a short-lived signed URL for one of a car's official documents.
 *
 * Authorization (this endpoint is the ONLY way to view a document):
 *   - the car's OWNER (their own license photo), or
 *   - an ADMIN (verification review).
 * Everyone else — including anonymous visitors and other logged-in users —
 * is refused, so a license (which carries the owner's personal data) cannot be
 * read by changing the car id in the URL (IDOR).
 *
 * Buyers never receive a document URL; the ad page shows a verification status
 * instead. That matches the product decision that documents are evidence for
 * verification, not marketing material.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let user;
  try {
    user = await authenticateRequest(request);
  } catch {
    return unauthorizedResponse();
  }
  if (!user) return unauthorizedResponse();

  const type = request.nextUrl.searchParams.get('type');
  if (type !== 'license' && type !== 'inspection') {
    return errorResponse('نوع المستند غير معروف', 400);
  }

  const car = await prisma.car.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: { id: true, userId: true, licenseDocUrl: true, inspectionDocUrl: true },
  });
  if (!car) return notFoundResponse('السيارة');

  // Ownership OR admin — the whole point of this route.
  const isOwner = car.userId === user.id;
  const isAdmin = user.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return errorResponse('لا تملك صلاحية الوصول إلى مستندات هذا الإعلان', 403);
  }

  const stored = type === 'license' ? car.licenseDocUrl : car.inspectionDocUrl;
  if (!stored) {
    return errorResponse(
      type === 'license' ? 'لا يوجد مستند ترخيص مرفق' : 'لا يوجد مستند فحص مرفق',
      404,
    );
  }

  // Local-storage fallback (no Cloudinary configured): stream the bytes with
  // headers that prevent caching and sniffing. Never expose a static path.
  if (stored.startsWith('private://')) {
    const name = stored.slice('private://'.length);
    // Defence in depth: reject any traversal attempt in the stored name.
    if (!/^[A-Za-z0-9._-]+$/.test(name)) return errorResponse('مستند غير صالح', 400);
    const abs = path.join(process.cwd(), 'storage', 'car-docs', name);
    try {
      const buf = await readFile(abs);
      return new Response(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch {
      return errorResponse('تعذر قراءة المستند', 404);
    }
  }

  const signed = signedDocumentUrl(stored);
  if (!signed) {
    // Never fall back to the stored URL: if we cannot authorise a view, we
    // must not hand the raw asset path to the caller.
    return errorResponse('تعذر تجهيز رابط آمن لهذا المستند', 500);
  }

  return successResponse({ url: signed, type, expiresInSeconds: 300 });
}
