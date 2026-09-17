import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, name: true, email: true, role: true, image: true, phone: true,
      whatsapp: true, bio: true, dealerName: true, dealerLogo: true,
      dealerDescription: true, dealerAddress: true, dealerLat: true, dealerLng: true,
      // Phase C trader marketplace fields
      dealerVerified: true, dealerViewCount: true, dealerBannerImage: true,
      dealerCommercialReg: true, phoneVerified: true,
      rating: true, ratingCount: true, isActive: true, createdAt: true, whatsappNotifications: true,
    },
  });

  return successResponse(fullUser);
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { name, phone, whatsapp, bio, image, dealerName, dealerDescription, dealerAddress, dealerLat, dealerLng, dealerLogo, dealerBannerImage, dealerCommercialReg, whatsappNotifications } = validation.data;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(bio !== undefined && { bio }),
        ...(image !== undefined && image !== '' && { image }),
        ...(dealerName !== undefined && { dealerName }),
        ...(dealerDescription !== undefined && { dealerDescription }),
        ...(dealerAddress !== undefined && { dealerAddress }),
        ...(dealerLat !== undefined && { dealerLat }),
        ...(dealerLng !== undefined && { dealerLng }),
        ...(dealerLogo !== undefined && { dealerLogo }),
        ...(dealerBannerImage !== undefined && { dealerBannerImage }),
        ...(dealerCommercialReg !== undefined && { dealerCommercialReg }),
        ...(whatsappNotifications !== undefined && { whatsappNotifications }),
      },
      select: {
        id: true, name: true, email: true, role: true, image: true, phone: true,
        whatsapp: true, whatsappNotifications: true, bio: true, dealerName: true, dealerLogo: true,
        dealerDescription: true, dealerAddress: true, dealerBannerImage: true, dealerCommercialReg: true,
        dealerLat: true, dealerLng: true, dealerVerified: true, isActive: true,
      },
    });

    await createAuditLog({
      action: 'UPDATE_PROFILE', actorId: user.id,
      entityType: 'USER', entityId: user.id,
      description: `تحديث الملف الشخصي: ${updated.name}`,
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Profile update error:', error);
    return errorResponse('فشل تحديث الملف الشخصي', 500);
  }
}
