import prisma from '@/lib/prisma';
import { sanitizeFeatures } from '@/lib/car-features';
import type { VehicleSpec } from './types';

export interface BuiltSpec {
  spec: VehicleSpec;
  carId: string | null;
  targetPrice: number | null;
}

/** Shared by POST /api/valuations and the SSE stream route. */
export async function buildSpecFromBody(body: any): Promise<BuiltSpec> {
  if (body?.carId) {
    const car = await prisma.car.findFirst({
      where: { OR: [{ id: body.carId }, { slug: body.carId }], deletedAt: null },
      include: { brand: true, model: true, city: true },
    });
    if (!car) throw Object.assign(new Error('السيارة غير موجودة'), { status: 404 });
    return {
      carId: car.id,
      targetPrice: typeof body.targetPrice === 'number' ? body.targetPrice : car.price,
      spec: {
        brand: car.brand?.nameAr || '', brandEn: car.brand?.nameEn || null,
        model: car.model?.nameAr || '', modelEn: car.model?.nameEn || null,
        year: car.year, trim: car.trim || null, kilometers: car.kilometers,
        fuelType: car.fuelType, transmission: car.transmission,
        drivetrain: (car as any).drivetrain || null,
        condition: car.condition, city: car.city?.nameAr || null,
        engineCapacity: (car as any).engineCapacity || null,
        horsepower: (car as any).horsepower || null,
        cylinders: (car as any).cylinders || null,
        specs: sanitizeFeatures((car as any).features),
      },
    };
  }
  if (body?.spec) {
    const s = body.spec;
    const year = Number(s.year);
    const km = Number(s.kilometers);
    if (!s.brand || !s.model || !Number.isFinite(year) || !Number.isFinite(km)) {
      throw Object.assign(new Error('المواصفات ناقصة أو غير صالحة (brand/model/year/kilometers مطلوبة)'), { status: 400 });
    }
    return {
      carId: null,
      targetPrice: typeof body.targetPrice === 'number' && Number.isFinite(body.targetPrice) ? body.targetPrice : null,
      spec: {
        brand: String(s.brand), brandEn: s.brandEn || null,
        model: String(s.model), modelEn: s.modelEn || null,
        year, trim: s.trim || null,
        kilometers: km,
        fuelType: s.fuelType || null, transmission: s.transmission || null,
        drivetrain: s.drivetrain || null, condition: s.condition || null,
        city: s.city || null, engineCapacity: s.engineCapacity || null,
        cylinders: s.cylinders || null, horsepower: s.horsepower || null,
        specs: Array.isArray(s.specs) ? s.specs.map(String).slice(0, 20) : [],
      },
    };
  }
  throw Object.assign(new Error('أرسل carId أو spec'), { status: 400 });
}
