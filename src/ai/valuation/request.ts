import prisma from '@/lib/prisma';
import { sanitizeFeatures } from '@/lib/car-features';
import { normalizeTargetCondition, sanitizeTrim, drivetrainFromTrim } from './spec-extract';
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
    // Phase 4: target condition -> normalized conditionScore/provenance.
    // Unknown/absent stays UNKNOWN (null score) — never assumes EXCELLENT.
    const cond = normalizeTargetCondition(car.condition);
    return {
      carId: car.id,
      targetPrice: typeof body.targetPrice === 'number' ? body.targetPrice : car.price,
      spec: {
        brand: car.brand?.nameAr || '', brandEn: car.brand?.nameEn || null,
        model: car.model?.nameAr || '', modelEn: car.model?.nameEn || null,
        year: car.year, trim: sanitizeTrim(car.trim), kilometers: car.kilometers,
        fuelType: car.fuelType || null, transmission: car.transmission || null,
        drivetrain: (car as any).drivetrain || drivetrainFromTrim(car.trim),
        condition: car.condition || null, city: car.city?.nameAr || null,
        conditionScore: cond.conditionScore,
        conditionCertainty: cond.conditionCertainty,
        engineCapacity: (car as any).engineCapacity ? Math.round(Number((car as any).engineCapacity)) : null,
        horsepower: (car as any).horsepower ? Math.round(Number((car as any).horsepower)) : null,
        cylinders: (car as any).cylinders ? Math.round(Number((car as any).cylinders)) : null,
        color: car.color || null,
        doors: (car as any).doors ? Number((car as any).doors) : null,
        bodyType: (car as any).bodyType || null,
        vin: (car as any).vin || null,
        askingPrice: car.price,
        specs: sanitizeFeatures((car as any).features),
        description: car.description || null,
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
    // Phase 4: same condition data flow for free-form specs.
    const cond = normalizeTargetCondition(s.condition);
    return {
      carId: null,
      targetPrice: typeof body.targetPrice === 'number' && Number.isFinite(body.targetPrice) ? body.targetPrice : null,
      spec: {
        brand: String(s.brand), brandEn: s.brandEn || null,
        model: String(s.model), modelEn: s.modelEn || null,
        year, trim: sanitizeTrim(s.trim),
        kilometers: km,
        fuelType: s.fuelType || null, transmission: s.transmission || null,
        drivetrain: s.drivetrain || drivetrainFromTrim(s.trim), condition: s.condition || null,
        conditionScore: cond.conditionScore,
        conditionCertainty: cond.conditionCertainty,
        city: s.city || null, engineCapacity: s.engineCapacity ? Math.round(Number(s.engineCapacity)) : null,
        cylinders: s.cylinders ? Math.round(Number(s.cylinders)) : null,
        horsepower: s.horsepower ? Math.round(Number(s.horsepower)) : null,
        color: s.color || null,
        doors: s.doors ? Number(s.doors) : null,
        bodyType: s.bodyType || null,
        vin: s.vin || null,
        askingPrice: typeof s.askingPrice === 'number' ? s.askingPrice : (typeof body.targetPrice === 'number' ? body.targetPrice : null),
        specs: Array.isArray(s.specs) ? s.specs.map(String).slice(0, 20) : [],
      },
    };
  }
  throw Object.assign(new Error('أرسل carId أو spec'), { status: 400 });
}
