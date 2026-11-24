import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const service = searchParams.get('service') || '';
    const province = searchParams.get('province') || '';
    const city = searchParams.get('city') || '';
    const brand = searchParams.get('brand') || '';
    const sortBy = searchParams.get('sortBy') || 'rating';
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const isMobile = searchParams.get('mobile') === 'true';
    const hasTowing = searchParams.get('towing') === 'true';
    const hasWarranty = searchParams.get('warranty') === 'true';
    const hasWaiting = searchParams.get('waiting') === 'true';
    const offersParts = searchParams.get('parts') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      isBanned: false,
      isPaused: false,
    };

    if (verifiedOnly) {
      where.isVerified = true;
    }

    if (isMobile) where.isMobileService = true;
    if (hasTowing) where.hasTowingService = true;
    if (hasWarranty) where.hasWarranty = true;
    if (hasWaiting) where.hasWaitingArea = true;
    if (offersParts) where.offersSpareParts = true;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (service) {
      where.services = { some: { name: { contains: service, mode: 'insensitive' } } };
    }

    if (province) {
      const provinceRecord = await prisma.province.findFirst({
        where: { nameAr: { contains: province } },
        select: { id: true },
      });
      if (provinceRecord) {
        where.provinceId = provinceRecord.id;
      }
    }

    if (city) {
      where.cityId = city;
    }

    if (brand) {
      where.brands = { some: { brand: { contains: brand, mode: 'insensitive' } } };
    }

    let orderBy: any[] = [{ isVerified: 'desc' }, { rating: 'desc' }];
    if (sortBy === 'newest') orderBy = [{ isVerified: 'desc' }, { createdAt: 'desc' }];
    else if (sortBy === 'views') orderBy = [{ isVerified: 'desc' }, { viewCount: 'desc' }];
    else if (sortBy === 'reviews') orderBy = [{ isVerified: 'desc' }, { reviewCount: 'desc' }];

    const [workshops, total] = await Promise.all([
      prisma.workshop.findMany({
        where,
        include: {
          services: true,
          brands: true,
          prices: true,
          user: {
            select: { id: true, name: true, image: true, phone: true, whatsapp: true },
          },
          reviews: {
            where: { isHidden: false },
            select: { id: true, qualityRating: true, recommend: true },
          },
          _count: { select: { reviews: true, appointments: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.workshop.count({ where }),
    ]);

    return successResponse({
      workshops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Workshops fetch error:', error);
    return errorResponse('فشل تحميل الورش', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const {
      name, description, phone, whatsapp, email, website, emergencyPhone,
      address, lat, lng, cityId, provinceId, logo, coverImage, gallery,
      workingHours, workingDays, yearsOfExperience, employeeCount,
      priceRange, isMobileService, hasTowingService, hasWarranty, warrantyPeriod,
      hasWaitingArea, offersSpareParts, paymentMethods, specialties, discountOffer,
      services, brands, prices,
    } = body;

    if (!name) return errorResponse('اسم الورشة مطلوب');

    // HTTP adapter لا يدعم المعاملات ولا createMany — ننفّذ بالتتابع مع حذف
    // تعويضي (البنين ثم الأب حسب القيود) لو فشلت أي خطوة، بدل roll-back المعاملة.
    let workshopId: string | null = null;
    let workshop: any;
    try {
      const newWorkshop = await prisma.workshop.create({
        data: {
          userId: user.id,
          name,
          description: description || null,
          phone: phone || user.phone || null,
          whatsapp: whatsapp || user.whatsapp || user.phone || null,
          email: email || user.email || null,
          website: website || null,
          emergencyPhone: emergencyPhone || null,
          address: address || null,
          lat: Number.isFinite(Number(lat)) ? Number(lat) : null,
          lng: Number.isFinite(Number(lng)) ? Number(lng) : null,
          cityId: cityId || null,
          provinceId: provinceId || null,
          logo: logo || null,
          coverImage: coverImage || null,
          gallery: Array.isArray(gallery) ? JSON.stringify(gallery) : (typeof gallery === 'string' ? gallery : '[]'),
          workingHours: workingHours || '08:00-17:00',
          workingDays: workingDays || 'Sun-Thu',
          yearsOfExperience: Number.isFinite(Number(yearsOfExperience)) ? Number(yearsOfExperience) : 0,
          employeeCount: Number.isFinite(Number(employeeCount)) ? Number(employeeCount) : 1,
          priceRange: priceRange || 'moderate',
          isMobileService: Boolean(isMobileService),
          hasTowingService: Boolean(hasTowingService),
          hasWarranty: Boolean(hasWarranty),
          warrantyPeriod: warrantyPeriod || null,
          hasWaitingArea: Boolean(hasWaitingArea),
          offersSpareParts: Boolean(offersSpareParts),
          paymentMethods: paymentMethods || 'CASH',
          specialties: Array.isArray(specialties) ? JSON.stringify(specialties) : (typeof specialties === 'string' ? specialties : '[]'),
          discountOffer: discountOffer || null,
        },
      });
      workshopId = newWorkshop.id;

      if (services && services.length > 0) {
        for (const s of services) {
          await prisma.workshopService.create({
            data: {
              workshopId: newWorkshop.id,
              name: typeof s === 'string' ? s : s.name,
              category: typeof s === 'string' ? null : (s.category || null),
            },
          });
        }
      }

      if (brands && brands.length > 0) {
        for (const b of brands) {
          await prisma.workshopBrand.create({
            data: {
              workshopId: newWorkshop.id,
              brand: typeof b === 'string' ? b : b.brand,
            },
          });
        }
      }

      if (prices && prices.length > 0) {
        for (const p of prices) {
          await prisma.workshopPrice.create({
            data: {
              workshopId: newWorkshop.id,
              serviceName: p.serviceName,
              minPrice: Number(p.minPrice) || 0,
              maxPrice: Number(p.maxPrice) || 0,
            },
          });
        }
      }

      workshop = await prisma.workshop.findUnique({
        where: { id: newWorkshop.id },
        include: { services: true, brands: true, prices: true },
      });
      if (!workshop) throw new Error('workshop row not found right after create');
    } catch (createErr) {
      if (workshopId) {
        await prisma.workshopService.deleteMany({ where: { workshopId } }).catch(() => {});
        await prisma.workshopBrand.deleteMany({ where: { workshopId } }).catch(() => {});
        await prisma.workshopPrice.deleteMany({ where: { workshopId } }).catch(() => {});
        await prisma.workshop.delete({ where: { id: workshopId } }).catch(() => {});
      }
      throw createErr;
    }

    return successResponse(workshop, 201);
  } catch (error) {
    console.error('Workshop creation error:', error);
    return errorResponse('فشل إنشاء الورشة', 500);
  }
}
