import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, validationErrorResponse } from '@/lib/api';
import { sanitizePlainText } from '@/lib/sanitize';
import { sendPushToUser } from '@/lib/push';

const carUpdateSchema = z.object({
  description: z.string().max(5000, 'الوصف طويل جدا').optional(),
  price: z.coerce.number().positive('السعر يجب أن يكون أكبر من 0').optional(),
  brandId: z.string().min(1, 'الشركة غير صالحة').optional(),
  modelId: z.string().min(1, 'الموديل غير صالح').optional(),
  year: z.coerce.number().int('سنة الصنع يجب أن تكون رقما صحيحا').min(1990, 'سنة الصنع يجب أن تكون 1990 أو أحدث').max(2030, 'سنة الصنع غير صالحة').optional(),
  kilometers: z.coerce.number().int('عدد الكيلومترات يجب أن يكون رقما صحيحا').min(0, 'عدد الكيلومترات يجب أن يكون 0 أو أكثر').optional(),
  fuelType: z.enum(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUGIN_HYBRID']).optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'CVT', 'DCT', 'SEMI_AUTOMATIC']).optional(),
  bodyType: z.enum(['SUV', 'SEDAN', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'WAGON', 'PICKUP', 'VAN', 'MINIVAN', 'CROSSOVER', 'SPORTS', 'LUXURY']).optional(),
  color: z.string().min(1).max(100).optional(),
  engineCapacity: z.coerce.number().positive('سعة المحرك يجب أن تكون أكبر من 0').optional(),
  cylinders: z.coerce.number().int().min(2).max(16).optional(),
  cityId: z.string().min(1).optional(),
  locationLat: z.coerce.number().min(-90).max(90).optional(),
  locationLng: z.coerce.number().min(-180).max(180).optional(),
  phone: z.string().min(1).max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  slug: z.string().min(1).max(300).optional(),
  soldAt: z.union([z.coerce.date(), z.null()]).optional(),
  inspectionCenter: z.string().max(300).nullable().optional(),
  inspectionDate: z.union([z.coerce.date(), z.null()]).optional(),
  isWholesale: z.boolean().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SOLD']).optional(),
  featured: z.boolean().optional(),
  featuredUntil: z.union([z.coerce.date(), z.null()]).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: carId } = await params;
  const user = await authenticateRequest(request).catch(() => null);
  try {
    const trackView = request.nextUrl.searchParams.get('trackView') === 'true';
    const imageLimit = parseInt(request.nextUrl.searchParams.get('imageLimit') || '6', 10);
    const safeImageLimit = Math.min(Math.max(imageLimit, 1), 20);

    const car = await prisma.car.findFirst({
      where: { OR: [{ id: carId }, { slug: carId }] },
      include: {
        brand: true,
        model: true,
        city: true,
        images: { orderBy: { order: 'asc' }, take: safeImageLimit },
        user: {
          select: {
            id: true, name: true, phone: true, whatsapp: true,
            image: true, dealerName: true, dealerLogo: true, dealerDescription: true,
            dealerAddress: true, dealerVerified: true, rating: true,
            ratingCount: true, createdAt: true, badges: true,
          },
        },
        _count: { select: { images: true } },
      },
    });

    if (!car) return notFoundResponse('السيارة');

    if (trackView) {
      prisma.car
        .update({ where: { id: car.id }, data: { views: { increment: 1 } } })
        .catch(() => {});
    }

    let isFavorited = false;
    if (user) {
      try {
        const fav = await prisma.favorite.findUnique({
          where: { carId_userId: { carId: car.id, userId: user.id } },
        });
        isFavorited = !!fav;
      } catch { /* ignore */ }
    }

    const totalImageCount = car._count.images;
    const hasMoreImages = totalImageCount > safeImageLimit;

    return successResponse({
      ...car,
      views: trackView ? car.views + 1 : car.views,
      isFavorited,
      totalImageCount,
      hasMoreImages,
      // Document URLs are never part of a public payload — a license carries
      // the owner's name/ID. Authorized viewers (owner/admin) fetch a
      // short-lived signed URL from /api/cars/[id]/documents instead.
      licenseDocUrl: null,
      inspectionDocUrl: null,
      // Only the boolean is public: it drives the "documents on file" chip.
      hasLicenseDoc: !!car.licenseDocUrl,
      hasInspectionDoc: !!car.inspectionDocUrl,
    });
  } catch (error) {
    console.error('Car fetch error:', error);
    return errorResponse('فشل تحميل السيارة', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return notFoundResponse('السيارة');
    if (car.userId !== user.id && user.role !== 'ADMIN') return errorResponse('لا تملك صلاحية تعديل هذه السيارة', 403);

    const body = await request.json();
    const allowedFields = [
      'description', 'price', 'brandId', 'modelId', 'year', 'kilometers',
      'fuelType', 'transmission', 'bodyType', 'color', 'engineCapacity', 'cylinders',
      'cityId', 'locationLat', 'locationLng', 'phone', 'whatsapp', 'slug',
      'soldAt', 'inspectionCenter', 'inspectionDate', 'isWholesale',
    ];

    // Only admins can change moderation/feature status
    // Car owners CANNOT approve their own cars - must go through admin review
    if (user.role === 'ADMIN') {
      allowedFields.push('status', 'featured', 'featuredUntil');
    }

    // Security: reject any attempt by non-admins to set status to APPROVED
    if (body.status === 'APPROVED' && user.role !== 'ADMIN') {
      return errorResponse('لا يمكن قبول الإعلان إلا مدير الموقع', 403);
    }

    // Car owners can update their car details but status stays PENDING until admin review
    // If owner tries to set any status field, force back to PENDING
    if (user.role !== 'ADMIN' && body.status) {
      body.status = 'PENDING';
    }

    // Prevent non-admins from setting featured/featuredUntil
    if (user.role !== 'ADMIN' && (body.featured === true || body.featuredUntil)) {
      return errorResponse('لا يمكن تمييز الإعلان إلا مدير الموقع', 403);
    }

    const safeData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) {
        if (key === 'description' && typeof body[key] === 'string') {
          safeData[key] = sanitizePlainText(body[key]);
        } else {
          safeData[key] = body[key];
        }
      }
    }

    const parsed = carUpdateSchema.safeParse(safeData);
    if (!parsed.success) return validationErrorResponse(parsed.error);
    const validatedData = parsed.data as Record<string, any>;

    // Owner content edits re-queue the listing for admin review.
    if (user.role !== 'ADMIN') {
      validatedData.status = 'PENDING';
    }

    const updated = await prisma.car.update({
      where: { id },
      data: validatedData,
      include: { brand: true, model: true, city: true, images: true },
    });

    // Price-drop alert: if the owner lowered the price, notify everyone
    // watching this car (favorites) — in-app notification + browser push.
    // Fire-and-forget, never blocks the response.
    if (validatedData.price !== undefined && Number(validatedData.price) < car.price) {
      const drop = car.price - Number(validatedData.price);
      const newPrice = Number(validatedData.price);
      const carLabel = `${updated.brand?.nameAr || ''} ${updated.model?.nameAr || ''} ${updated.year}`.trim();
      const link = `/cars/${updated.slug || id}`;
      prisma.favorite.findMany({ where: { carId: id }, select: { userId: true } }).then(async (favs) => {
        const targets = [...new Set(favs.map(f => f.userId))].filter(uid => uid !== user.id);
        if (targets.length === 0) return;
        await prisma.notification.createMany({
          data: targets.map(uid => ({
            type: 'PRICE_DROP',
            title: 'انخفاض سعر سيارة تتابعها ',
            message: `${carLabel} — نزل السعر ${drop.toLocaleString('ar-JO')} د.أ وأصبح ${newPrice.toLocaleString('ar-JO')} د.أ`,
            userId: uid,
            link,
          })),
        });
        // Browser push for the same watchers (only subscribed browsers get it)
        await Promise.all(targets.map(uid => sendPushToUser(uid, {
          title: 'انخفاض سعر سيارة تتابعها ',
          body: `${carLabel} أصبحت ${newPrice.toLocaleString('ar-JO')} د.أ (نزول ${drop.toLocaleString('ar-JO')})`,
          url: link,
        }))).catch(() => {});
      }).catch(() => {});
    }

    return successResponse(updated);
  } catch (error) {
    console.error('Car update error:', error);
    return errorResponse('فشل تحديث السيارة', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return notFoundResponse('السيارة');
    // Owners can delete their own listings; admins can delete any.
    if (car.userId !== user.id && user.role !== 'ADMIN') return errorResponse('لا تملك صلاحية حذف هذه السيارة', 403);
    if (car.deletedAt) return errorResponse('السيارة محذوفة بالفعل', 400);

    await prisma.car.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: user.role === 'ADMIN' ? 'ADMIN' : 'USER' } });
    await prisma.carLog.create({ data: { carId: id, userId: user.id, action: 'SOFT_DELETED' } });
    return successResponse({ deleted: true, soft: true });
  } catch (error) {
    console.error('Car delete error:', error);
    return errorResponse('فشل حذف السيارة', 500);
  }
}
