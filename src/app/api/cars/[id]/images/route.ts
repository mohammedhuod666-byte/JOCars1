import { NextRequest } from 'next/server';
import prisma, { invalidateCache } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { checkImageOrder, orderErrorMessage } from '@/lib/image-order';
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse } from '@/lib/api';

/**
 * Lazy-load additional images for a car listing.
 * The main /api/cars/[id] endpoint returns only 6 images to keep the payload
 * small on mobile. This endpoint loads the rest on demand.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: carId } = await params;
  try {
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '6', 10);
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
    const safeLimit = Math.min(Math.max(limit, 1), 30);

    const car = await prisma.car.findFirst({
      where: { OR: [{ id: carId }, { slug: carId }], deletedAt: null },
      select: { id: true },
    });

    if (!car) return notFoundResponse('السيارة');

    const images = await prisma.carImage.findMany({
      where: { carId: car.id },
      orderBy: { order: 'asc' },
      skip: offset,
      take: safeLimit,
      select: { id: true, url: true, isCover: true, order: true },
    });

    return successResponse({ images, hasMore: images.length === safeLimit });
  } catch (error) {
    console.error('Car images fetch error:', error);
    return errorResponse('فشل تحميل الصور', 500);
  }
}

/**
 * PATCH /api/cars/[id]/images — reorder the gallery and/or change the cover.
 *
 * Body: { order: string[], coverImageId?: string }
 *
 * Why this exists: the wizard lets a seller drag-reorder before publishing, but
 * once published the order was frozen — PUT /api/cars/[id] deliberately rejects
 * an `images` array, so a seller who realises the best angle is #7 had no way to
 * fix it without a new listing. Photo order IS the difference between an ad that
 * sells and one that does not.
 *
 * SECURITY — the ownership of every image id is verified, not trusted.
 * The submitted `order` must contain EXACTLY the ids of images belonging to THIS
 * car: same length, no duplicates, no unknown ids. Without that check, a seller
 * could submit ids from another listing, which would both leak that listing's
 * image order and (via coverImageId) point their own cover at an image they do
 * not own. Verifying against the database rather than against the request body
 * is what makes this an authorization check instead of a formatting step.
 *
 * Deliberately does NOT touch `status`: reordering photos is not a reason to
 * re-enter moderation, and changing that rule is a moderation decision, not an
 * engineering one.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: carId } = await params;

  let user;
  try {
    user = await authenticateRequest(request);
  } catch {
    return unauthorizedResponse();
  }
  if (!user) return unauthorizedResponse();

  let body: { order?: unknown; coverImageId?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse('صيغة الطلب غير صحيحة', 400);
  }

  try {
    const car = await prisma.car.findFirst({
      where: { OR: [{ id: carId }, { slug: carId }], deletedAt: null },
      select: { id: true, userId: true, coverImage: true },
    });
    if (!car) return notFoundResponse('السيارة');
    if (car.userId !== user.id && user.role !== 'ADMIN') {
      return errorResponse('لا تملك صلاحية تعديل صور هذا الإعلان', 403);
    }

    const existing = await prisma.carImage.findMany({
      where: { carId: car.id },
      select: { id: true, url: true },
    });
    const existingIds = existing.map((i) => i.id);

    // The exact-set ownership check lives in lib/image-order.ts so it can be
    // tested without a database — it is the rule that prevents one seller from
    // touching another seller's gallery.
    const check = checkImageOrder(body.order, existingIds, body.coverImageId);
    if (!check.ok) return errorResponse(orderErrorMessage(check.code), 400);

    const order = body.order as string[];

    // Cover: must be one of THIS car's images. Absent coverImageId keeps the
    // current cover unless the caller demoted it by reordering.
    let coverId: string | null = null;
    if (typeof body.coverImageId === 'string' && body.coverImageId) {
      coverId = body.coverImageId;
    } else {
      const currentCover = existing.find((i) => i.url === car.coverImage);
      coverId = currentCover?.id ?? (order.length ? order[0] : null);
    }

    const urlById = new Map(existing.map((i) => [i.id, i.url]));

    // HTTP adapter لا يدعم $transaction المتسلسل — ننفّذ نفس العمليات المتتالية
    // (كلها تحديثات صف واحد مدعومة). فشل في المنتصف يترك ترتيبًا جزئيًا،
    // وإعادة المحاولة بنفس الترتيب تكمل بلا ضرر لأن كل تحديث idempotent.
    for (const [index, imageId] of order.entries()) {
      await prisma.carImage.update({
        where: { id: imageId },
        data: {
          order: index,
          // Exactly one row carries the flag, so the card and the carousel can
          // never disagree about the first image.
          isCover: imageId === coverId,
        },
      });
    }
    await prisma.car.update({
      where: { id: car.id },
      // Keep the denormalised coverImage in step with the isCover row: the ad
      // card and the search grid read this column directly.
      data: { coverImage: coverId ? urlById.get(coverId) ?? null : null },
    });

    const updated = await prisma.carImage.findMany({
      where: { carId: car.id },
      orderBy: { order: 'asc' },
      select: { id: true, url: true, isCover: true, order: true },
    });

    // Drop the in-process list cache. Without this the seller's own list kept
    // serving the pre-reorder order for up to 15s, which reads as "my save did
    // nothing" — the change was persisted, just not visible yet.
    invalidateCache('cars');

    return successResponse({ images: updated });
  } catch (error) {
    console.error('Car images reorder error:', error);
    return errorResponse('تعذر حفظ ترتيب الصور', 500);
  }
}
