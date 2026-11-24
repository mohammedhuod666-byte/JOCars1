import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';
import { sendWhatsAppToUser, buildUserMessage } from '@/lib/whatsapp';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { planId } = await request.json();
    if (!planId) return errorResponse('معرف الباقة مطلوب', 400);

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return notFoundResponse('الباقة');

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + plan.durationDays);

    // HTTP adapter: write without include (implicit read transaction would
    // throw), then fetch the relations in a separate read.
    await prisma.car.update({
      where: { id },
      data: { featured: true, featuredUntil },
    });
    const car = await prisma.car.findUnique({
      where: { id },
      include: { brand: true, model: true },
    });
    if (!car) return notFoundResponse('السيارة');

    await createAuditLog({
      action: 'FEATURE_CAR', actorId: user.id,
      entityType: 'CAR', entityId: id,
      description: `تمييز سيارة ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} لمدة ${plan.durationDays} يوم`,
      newValue: `مميزة حتى ${featuredUntil.toISOString()}`,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    await prisma.notification.create({
      data: {
        type: 'CAR_FEATURED',
        title: 'إعلان مميز',
        message: `تم تمييز إعلان ${car.brand?.nameAr} ${car.model?.nameAr} لمدة ${plan.durationDays} يوم`,
        userId: car.userId,
        link: `/cars/${car.slug || car.id}`,
      },
    });

    const carTitle = `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`;
    sendWhatsAppToUser(car.userId, buildUserMessage('car_featured', { carTitle, carSlug: car.slug || car.id }));

    return successResponse(car);
  } catch (error) {
    return errorResponse('فشل تمييز السيارة', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    // HTTP adapter: write without include, then read relations separately.
    await prisma.car.update({
      where: { id },
      data: { featured: false, featuredUntil: null },
    });
    const car = await prisma.car.findUnique({
      where: { id },
      include: { brand: true, model: true },
    });
    if (!car) return notFoundResponse('السيارة');

    await createAuditLog({
      action: 'UNFEATURE_CAR', actorId: user.id,
      entityType: 'CAR', entityId: id,
      description: `إلغاء تمييز سيارة ${car.brand?.nameAr || ''} ${car.model?.nameAr || ''}`,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return successResponse(car);
  } catch (error) {
    return errorResponse('فشل إلغاء التمييز', 500);
  }
}
