import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';
import { checkPriceAlerts } from '@/lib/check-price-alerts';
import { calculateFairPrice } from '@/lib/fair-price';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await authenticateRequest(request);
  if (!actor || actor.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const oldCar = await prisma.car.findUnique({ where: { id }, include: { brand: true, model: true, user: true } });
    if (!oldCar) return notFoundResponse('السيارة');

    const allowedFields = [
      'title', 'description', 'price', 'status', 'featured', 'featuredUntil',
      'views', 'slug', 'refCode', 'deletedAt', 'deletedBy',
      'inspectionVerified', 'inspectionCenter', 'inspectionDate',
    ];
    const safeData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) safeData[key] = body[key];
    }

    const updated = await prisma.car.update({
      where: { id },
      data: safeData,
      include: { brand: { select: { nameAr: true } }, model: { select: { nameAr: true } }, user: { select: { name: true } } },
    });

    if (body.status && body.status !== oldCar.status) {
      const action = body.status === 'APPROVED' ? 'APPROVE_CAR' : body.status === 'REJECTED' ? 'REJECT_CAR' : null;
      if (action) {
        await createAuditLog({
          action, actorId: actor.id,
          entityType: 'CAR', entityId: id,
          description: `${action === 'APPROVE_CAR' ? 'قبول' : 'رفض'} سيارة ${oldCar.brand?.nameAr || ''} ${oldCar.model?.nameAr || ''} لصاحبها ${oldCar.user?.name || ''}`,
          oldValue: oldCar.status, newValue: body.status,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        });
      }
      if (body.status === 'APPROVED') {
        try { await checkPriceAlerts(id); } catch {}
        try { await calculateFairPrice(id); } catch {}
        // Fire-and-forget initial valuation so every approved car carries
        // a market value without blocking the response (spec §13 revalue).
        try {
          const { runValuation } = await import('@/ai/valuation/engine');
          const { sanitizeFeatures } = await import('@/lib/car-features');
          runValuation(
            {
              brand: oldCar.brand?.nameAr || '', brandEn: oldCar.brand?.nameEn || null,
              model: oldCar.model?.nameAr || '', modelEn: oldCar.model?.nameEn || null,
              year: oldCar.year, trim: oldCar.trim || null,
              kilometers: oldCar.kilometers || 0,
              fuelType: oldCar.fuelType || null,
              transmission: oldCar.transmission || null,
              drivetrain: (oldCar as any).drivetrain || null,
              condition: oldCar.condition || null,
              city: null, engineCapacity: oldCar.engineCapacity || null,
              horsepower: (oldCar as any).horsepower || null,
              specs: sanitizeFeatures((oldCar as any).features),
            },
            { carId: id, userId: null, targetPrice: oldCar.price ?? null },
          ).catch(() => {});
        } catch { /* best-effort background valuation */ }
      }
    }

    if (body.price && body.price !== oldCar.price) {
      await createAuditLog({
        action: 'UPDATE_CAR_PRICE', actorId: actor.id,
        entityType: 'CAR', entityId: id,
        description: `تعديل سعر سيارة ${oldCar.brand?.nameAr || ''} من ${oldCar.price} إلى ${body.price}`,
        oldValue: `${oldCar.price}`, newValue: `${body.price}`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      });
    }

    return successResponse(updated);
  } catch (error) {
    return errorResponse('فشل تحديث السيارة', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await authenticateRequest(request);
  if (!actor || actor.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const oldCar = await prisma.car.findUnique({
      where: { id },
      include: { brand: true, model: true, user: { select: { name: true } } },
    });
    if (!oldCar) return notFoundResponse('السيارة');

    await prisma.$transaction([
      prisma.carViewer.deleteMany({ where: { carId: id } }),
      prisma.carReminder.deleteMany({ where: { carId: id } }),
      prisma.carComment.deleteMany({ where: { carId: id } }),
      prisma.carTagAssignment.deleteMany({ where: { carId: id } }),
      prisma.premiumRequest.deleteMany({ where: { carId: id } }),
      prisma.userRating.deleteMany({ where: { carId: id } }),
      prisma.carHistory.deleteMany({ where: { carId: id } }),
      prisma.carLog.deleteMany({ where: { carId: id } }),
      prisma.comparisonItem.deleteMany({ where: { carId: id } }),
      prisma.carView.deleteMany({ where: { carId: id } }),
      prisma.report.deleteMany({ where: { carId: id } }),
      prisma.message.deleteMany({ where: { carId: id } }),
      prisma.conversation.deleteMany({ where: { carId: id } }),
      prisma.favorite.deleteMany({ where: { carId: id } }),
      prisma.auction.deleteMany({ where: { carId: id } }),
      prisma.carImage.deleteMany({ where: { carId: id } }),
      prisma.car.delete({ where: { id } }),
    ]);

    await createAuditLog({
      action: 'DELETE_CAR', actorId: actor.id,
      entityType: 'CAR', entityId: id,
      description: `حذف سيارة ${oldCar.brand?.nameAr || ''} ${oldCar.model?.nameAr || ''} لصاحبها ${oldCar.user?.name || ''}`,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('Delete car error:', error);
    return errorResponse('فشل حذف السيارة', 500);
  }
}
