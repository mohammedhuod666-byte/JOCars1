import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { scoreListing } from '@/lib/cars/listing-score';
import { sanitizeFeatures } from '@/lib/cars/car-features';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const where: Record<string, unknown> = { userId: user.id };
    if (status) where.status = status;
    const cars = await prisma.car.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: true, model: true, city: true,
        images: { take: 1, orderBy: { order: 'asc' } },
        _count: { select: { favorites: true, messages: true, carViews: true, images: true } },
      },
    });

    // Server-computed readiness per listing, so the dashboard shows the same
    // number the wizard and /completeness show. Document URLs are replaced with
    // booleans: the owner does not need raw URLs in a list payload, and keeping
    // them out of list responses is what prevents accidental leaks.
    const data = cars.map((car) => {
      const { licenseDocUrl, inspectionDocUrl, serviceRecordDocUrl, ...rest } = car;
      const imageCount = (car as any)._count?.images;
      const completeness = scoreListing({
        brandId: car.brandId,
        modelId: car.modelId,
        year: car.year,
        kilometers: car.kilometers,
        fuelType: car.fuelType,
        transmission: car.transmission,
        color: car.color,
        condition: car.condition,
        description: car.description,
        price: car.price,
        cityId: car.cityId,
        locationLat: car.locationLat,
        locationLng: car.locationLng,
        phone: car.phone,
        imageCount,
        hasLicenseDoc: !!licenseDocUrl,
        hasInspectionDoc: !!inspectionDocUrl,
        hasServiceHistory: car.hasServiceHistory,
        videoUrl: car.videoUrl,
        vin: car.vin,
        featuresCount: (() => { try { return sanitizeFeatures(car.features).length; } catch { return 0; } })(),
        customsStatus: car.customsStatus,
        accidentHistory: car.accidentHistory,
        serviceRecordStatus: car.serviceRecordStatus,
        ownershipSource: car.ownershipSource,
      });
      return {
        ...rest,
        hasLicenseDoc: !!licenseDocUrl,
        hasInspectionDoc: !!inspectionDocUrl,
        hasServiceRecordDoc: !!serviceRecordDocUrl,
        completeness: {
          percent: completeness.percent,
          strength: completeness.strength,
          canPublish: completeness.canPublish,
          missingRequired: completeness.missingRequired.map((m) => ({ key: m.key, label: m.label })),
        },
      };
    });

    return successResponse(data);
  } catch { return errorResponse('فشل تحميل السيارات', 500); }
}
