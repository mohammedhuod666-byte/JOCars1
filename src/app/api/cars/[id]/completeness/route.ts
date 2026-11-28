import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { errorResponse, notFoundResponse, successResponse, unauthorizedResponse } from '@/lib/api';
import { scoreListing } from '@/lib/cars/listing-score';
import { sanitizeFeatures } from '@/lib/cars/car-features';

/**
 * GET /api/cars/[id]/completeness
 *
 * Server-computed completeness + strength for a listing, plus the pre-publish
 * checklist. The score is derived from the stored row (see lib/listing-score)
 * so it cannot be gamed from the client and matches what an auditor reproduces.
 *
 * Access: the listing's owner, or an admin. A competitor must not be able to
 * read another seller's gaps.
 */
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

  const car = await prisma.car.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: {
      id: true, userId: true, brandId: true, modelId: true, year: true,
      kilometers: true, fuelType: true, transmission: true, color: true,
      condition: true, description: true, price: true, cityId: true,
      locationLat: true, locationLng: true, phone: true, videoUrl: true,
      vin: true, features: true, isWholesale: true, hasServiceHistory: true,
      licenseDocUrl: true, inspectionDocUrl: true,
      customsStatus: true, accidentHistory: true, serviceRecordStatus: true,
      ownershipSource: true,
      _count: { select: { images: true } },
    },
  });
  if (!car) return notFoundResponse('السيارة');

  if (car.userId !== user.id && user.role !== 'ADMIN') {
    return errorResponse('لا تملك صلاحية الوصول إلى هذه البيانات', 403);
  }

  const features = (() => {
    try {
      return sanitizeFeatures(car.features);
    } catch {
      return [];
    }
  })();

  // Legacy ads stored customs only inside the description text, so fall back to
  // that for old rows; new ads have a real column.
  const hasCustoms = !!car.customsStatus
    || /الجمرك:\s*(جمركي|مستورد|مسجل|معفى|معفي|مجمركة)/.test(car.description || '');

  const result = scoreListing({
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
    imageCount: car._count.images,
    hasLicenseDoc: !!car.licenseDocUrl,
    hasInspectionDoc: !!car.inspectionDocUrl,
    videoUrl: car.videoUrl,
    vin: car.vin,
    featuresCount: features.length,
    customsStatus: hasCustoms ? 'SET' : null,
    hasServiceHistory: car.hasServiceHistory,
    accidentHistory: car.accidentHistory,
    serviceRecordStatus: car.serviceRecordStatus,
    ownershipSource: car.ownershipSource,
  });

  return successResponse(result);
}
