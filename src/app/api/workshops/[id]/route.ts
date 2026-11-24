import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        services: true,
        brands: true,
        prices: true,
        user: {
          select: { id: true, name: true, image: true, phone: true, whatsapp: true },
        },
        reviews: {
          where: { isHidden: false },
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        ads: {
          where: { status: 'published', isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!workshop) return notFoundResponse('الورشة');

    await prisma.workshop.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return successResponse(workshop);
  } catch (error) {
    console.error('Workshop fetch error:', error);
    return errorResponse('فشل تحميل الورشة', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');
    if (workshop.userId !== user.id && user.role !== 'ADMIN') return unauthorizedResponse();

    const body = await request.json();
    const {
      name, description, phone, whatsapp, email, website, emergencyPhone,
      address, lat, lng, cityId, provinceId, logo, coverImage, gallery,
      workingHours, workingDays, yearsOfExperience, employeeCount,
      priceRange, isMobileService, hasTowingService, hasWarranty, warrantyPeriod,
      hasWaitingArea, offersSpareParts, paymentMethods, specialties, discountOffer,
      services, brands, prices,
    } = body;

    // HTTP adapter لا يدعم المعاملات ولا createMany — ننفّذ بالتتابع:
    // تعديل الحقول ثم استبدال كل مجموعة (deleteMany ثم إنشاء صفًا صفًا) ثم
    // إعادة الجلب. لو فشلت أي خطوة لا يوجد roll-back لحقول الورشة، لكن
    // إعادة المحاولة تلتئم كاملة لأن الاستبدال idempotent (حذف + إنشاء).
    const updatedWorkshop = await prisma.workshop.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(phone !== undefined && { phone }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(emergencyPhone !== undefined && { emergencyPhone }),
        ...(address !== undefined && { address }),
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
        ...(cityId !== undefined && { cityId }),
        ...(provinceId !== undefined && { provinceId }),
        ...(logo !== undefined && { logo }),
        ...(coverImage !== undefined && { coverImage }),
        ...(gallery !== undefined && { gallery: Array.isArray(gallery) ? JSON.stringify(gallery) : gallery }),
        ...(workingHours !== undefined && { workingHours }),
        ...(workingDays !== undefined && { workingDays }),
        ...(yearsOfExperience !== undefined && { yearsOfExperience: Number(yearsOfExperience) }),
        ...(employeeCount !== undefined && { employeeCount: Number(employeeCount) }),
        ...(priceRange !== undefined && { priceRange }),
        ...(isMobileService !== undefined && { isMobileService: Boolean(isMobileService) }),
        ...(hasTowingService !== undefined && { hasTowingService: Boolean(hasTowingService) }),
        ...(hasWarranty !== undefined && { hasWarranty: Boolean(hasWarranty) }),
        ...(warrantyPeriod !== undefined && { warrantyPeriod }),
        ...(hasWaitingArea !== undefined && { hasWaitingArea: Boolean(hasWaitingArea) }),
        ...(offersSpareParts !== undefined && { offersSpareParts: Boolean(offersSpareParts) }),
        ...(paymentMethods !== undefined && { paymentMethods }),
        ...(specialties !== undefined && { specialties: Array.isArray(specialties) ? JSON.stringify(specialties) : specialties }),
        ...(discountOffer !== undefined && { discountOffer }),
      },
    });

    if (services && Array.isArray(services)) {
      await prisma.workshopService.deleteMany({ where: { workshopId: id } });
      for (const s of services) {
        await prisma.workshopService.create({
          data: { workshopId: id, name: s.name, category: s.category || null },
        });
      }
    }

    if (brands && Array.isArray(brands)) {
      await prisma.workshopBrand.deleteMany({ where: { workshopId: id } });
      for (const b of brands) {
        await prisma.workshopBrand.create({ data: { workshopId: id, brand: b.brand } });
      }
    }

    if (prices && Array.isArray(prices)) {
      await prisma.workshopPrice.deleteMany({ where: { workshopId: id } });
      for (const p of prices) {
        await prisma.workshopPrice.create({
          data: { workshopId: id, serviceName: p.serviceName, minPrice: p.minPrice, maxPrice: p.maxPrice },
        });
      }
    }

    const updated = await prisma.workshop.findUnique({
      where: { id },
      include: { services: true, brands: true, prices: true },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Workshop update error:', error);
    return errorResponse('فشل تحديث الورشة', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');
    if (workshop.userId !== user.id && user.role !== 'ADMIN') return unauthorizedResponse();

    await prisma.workshop.delete({ where: { id } });

    return successResponse({ message: 'تم حذف الورشة بنجاح' });
  } catch (error) {
    console.error('Workshop delete error:', error);
    return errorResponse('فشل حذف الورشة', 500);
  }
}
