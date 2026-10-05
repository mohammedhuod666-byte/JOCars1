import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { errorResponse, notFoundResponse, successResponse, unauthorizedResponse } from '@/lib/api';
import { signedDocumentUrl } from '@/lib/car-documents';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * GET /api/cars/[id]/documents?type=license|inspection|inspectionExtra|serviceRecord
 *                                   [&index=N for inspectionExtra]
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
 *
 * `inspectionExtra` addresses one page of a multi-page report by index. The
 * index is validated against the STORED array, so an out-of-range or negative
 * value cannot walk into another record.
 */

type DocType = 'license' | 'inspection' | 'inspectionExtra' | 'serviceRecord';

const DOC_TYPES: DocType[] = ['license', 'inspection', 'inspectionExtra', 'serviceRecord'];

/**
 * A stored PDF lives under resource_type `raw`, an image under `image`. Cloudinary
 * encodes this in the delivery URL, which is how the client knows whether to
 * render an <img> or offer a download. Detection is best-effort: the caller still
 * receives a URL that works either way.
 */
function isPdfAsset(url: string): boolean {
  return /\/raw\/authenticated\//.test(url) || /\.pdf(\?|$)/i.test(url);
}

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

  const typeParam = request.nextUrl.searchParams.get('type') || '';
  if (!DOC_TYPES.includes(typeParam as DocType)) {
    return errorResponse('نوع المستند غير معروف', 400);
  }
  const type = typeParam as DocType;

  const car = await prisma.car.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: {
      id: true,
      userId: true,
      licenseDocUrl: true,
      inspectionDocUrl: true,
      serviceRecordDocUrl: true,
      inspectionDocUrls: true,
    },
  });
  if (!car) return notFoundResponse('السيارة');

  // Ownership OR admin — the whole point of this route.
  const isOwner = car.userId === user.id;
  const isAdmin = user.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return errorResponse('لا تملك صلاحية الوصول إلى مستندات هذا الإعلان', 403);
  }

  /** Resolves the stored URL for the requested slot, or an error message. */
  const resolve = (): { stored: string | null; missing: string; index?: number } => {
    if (type === 'license') {
      return { stored: car.licenseDocUrl, missing: 'لا يوجد مستند ترخيص مرفق' };
    }
    if (type === 'inspection') {
      return { stored: car.inspectionDocUrl, missing: 'لا يوجد مستند فحص مرفق' };
    }
    if (type === 'serviceRecord') {
      return { stored: car.serviceRecordDocUrl, missing: 'لا يوجد سجل صيانة مرفق' };
    }
    // inspectionExtra: parse the stored JSON array defensively.
    let list: string[] = [];
    if (car.inspectionDocUrls) {
      try {
        const parsed = JSON.parse(car.inspectionDocUrls);
        if (Array.isArray(parsed)) list = parsed.filter((x): x is string => typeof x === 'string');
      } catch {
        // A corrupt column must not 500; it simply means no extra pages.
        list = [];
      }
    }
    const raw = request.nextUrl.searchParams.get('index');
    // Reject anything that is not a plain non-negative integer BEFORE indexing,
    // so no value can reach a JS array index in an unexpected form.
    const idx = raw !== null && /^\d+$/.test(raw) ? parseInt(raw, 10) : 0;
    const stored = list[idx];
    return {
      stored: stored || null,
      missing: list.length === 0
        ? 'لا توجد صفحات إضافية لتقرير الفحص'
        : `صفحة الفحص رقم ${idx + 1} غير موجودة`,
      index: idx,
    };
  };

  const { stored, missing, index } = resolve();
  if (!stored) return errorResponse(missing, 404);

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
          'Content-Type': isPdfAsset(name) ? 'application/pdf' : 'image/jpeg',
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

  return successResponse({
    url: signed,
    type,
    ...(index !== undefined ? { index } : {}),
    // The client cannot render a PDF in an <img>; it needs to know which.
    isPdf: isPdfAsset(stored),
    expiresInSeconds: 300,
  });
}
