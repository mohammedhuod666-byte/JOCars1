import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';

const HERO_SETTING_ID = 'hero_spotlight_car';

const CAR_INCLUDE = {
  brand: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
  model: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
  city: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
  images: { orderBy: { order: 'asc' as const }, take: 3 },
  user: { select: { id: true, name: true, dealerName: true, dealerVerified: true } },
};

export async function GET() {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { id: HERO_SETTING_ID },
      select: { homeHeroTitle: true },
    }).catch(() => null);

    const pinnedId = setting?.homeHeroTitle?.trim() || null;
    let car = null;
    let isAdminSelected = false;

    if (pinnedId) {
      car = await prisma.car.findFirst({
        where: { id: pinnedId, deletedAt: null, status: 'APPROVED' },
        include: CAR_INCLUDE,
      });
      if (car) isAdminSelected = true;
    }

    if (!car) {
      car = await prisma.car.findFirst({
        where: { deletedAt: null, status: 'APPROVED', featured: true },
        orderBy: { updatedAt: 'desc' },
        include: CAR_INCLUDE,
      });
    }

    if (!car) {
      car = await prisma.car.findFirst({
        where: { deletedAt: null, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        include: CAR_INCLUDE,
      });
    }

    return successResponse({
      car: car || null,
      heroCarId: pinnedId,
      isAdminSelected,
    });
  } catch (err) {
    console.error('[GET /api/hero-car] error:', err);
    return errorResponse('تعذر جلب إعلان المقدمة', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user || user.role !== 'ADMIN') {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json().catch(() => null);
    const carId = typeof body?.carId === 'string' && body.carId.trim() ? body.carId.trim() : null;

    if (carId) {
      const car = await prisma.car.findFirst({
        where: { id: carId, deletedAt: null },
        include: { brand: true, model: true },
      });
      if (!car) return notFoundResponse('السيارة');

      await prisma.siteSettings.upsert({
        where: { id: HERO_SETTING_ID },
        update: { homeHeroTitle: carId },
        create: { id: HERO_SETTING_ID, homeHeroTitle: carId },
      });

      await createAuditLog({
        action: 'SET_HERO_CAR',
        actorId: user.id,
        entityType: 'CAR',
        entityId: carId,
        description: `تعيين السيارة ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} في واجهة الموقع الرئيسية`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      }).catch(() => {});

      return successResponse({ heroCarId: carId });
    } else {
      await prisma.siteSettings.upsert({
        where: { id: HERO_SETTING_ID },
        update: { homeHeroTitle: '' },
        create: { id: HERO_SETTING_ID, homeHeroTitle: '' },
      });
      return successResponse({ heroCarId: null });
    }
  } catch (err) {
    console.error('[POST /api/hero-car] error:', err);
    return errorResponse('فشل تحديث إعلان المقدمة', 500);
  }
}
