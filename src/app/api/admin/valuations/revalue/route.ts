import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { runValuation } from '@/ai/valuation/engine';
import { createAuditLog } from '@/lib/audit';
import { sanitizeFeatures } from '@/lib/car-features';

const schema = z.object({
  carIds: z.array(z.string().min(1)).min(1).max(5),
});

// Admin batch re-valuation (spec §13): sequential, bounded (5 cars/call),
// per-car outcome + failure isolation. The admin UI pages through the fleet.
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const results: { carId: string; status: string; estimated?: number; error?: string }[] = [];
  for (const carId of parsed.data.carIds) {
    try {
      const car = await prisma.car.findUnique({
        where: { id: carId },
        include: { brand: true, model: true, city: true },
      });
      if (!car || car.deletedAt) {
        results.push({ carId, status: 'SKIPPED', error: 'غير موجودة' });
        continue;
      }
      const r = await runValuation(
        {
          brand: car.brand?.nameAr || '', brandEn: car.brand?.nameEn || null,
          model: car.model?.nameAr || '', modelEn: car.model?.nameEn || null,
          year: car.year, trim: car.trim || null, kilometers: car.kilometers,
          fuelType: car.fuelType, transmission: car.transmission,
          drivetrain: (car as any).drivetrain || null,
          condition: car.condition, city: car.city?.nameAr || null,
          engineCapacity: (car as any).engineCapacity || null,
          horsepower: (car as any).horsepower || null,
          specs: sanitizeFeatures((car as any).features),
        },
        { carId: car.id, userId: user.id, targetPrice: car.price },
      );
      results.push({
        carId, status: r.status,
        estimated: r.output?.estimatedPrice,
        error: r.insufficientReason,
      });
    } catch (e: any) {
      results.push({ carId, status: 'FAILED', error: e?.message || 'فشل' });
    }
  }

  await createAuditLog({
    action: 'VALUATION_REVALUE', actorId: user.id,
    entityType: 'SYSTEM', entityId: parsed.data.carIds.join(','),
    description: `إعادة تقييم دفعية: ${results.filter((r) => r.status === 'DONE').length}/${results.length} نجح`,
  }).catch(() => {});

  return successResponse({ results });
}

// GET: fleet overview for batching (ids of approved cars, paged).
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = 20;
  const where = { status: 'APPROVED', deletedAt: null };
  const [total, cars] = await Promise.all([
    prisma.car.count({ where }),
    prisma.car.findMany({
      where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      select: {
        id: true, year: true, price: true,
        brand: { select: { nameAr: true } }, model: { select: { nameAr: true } },
        valuationRequests: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true, status: true, result: { select: { estimatedPrice: true } } } },
      },
    }),
  ]);
  return successResponse({
    total, page, totalPages: Math.max(1, Math.ceil(total / limit)),
    cars: cars.map((c) => ({
      id: c.id, title: `${c.brand?.nameAr || ''} ${c.model?.nameAr || ''} ${c.year}`.trim(),
      price: c.price,
      lastValuation: c.valuationRequests[0] ? {
        at: c.valuationRequests[0].createdAt,
        status: c.valuationRequests[0].status,
        estimated: c.valuationRequests[0].result?.estimatedPrice || null,
      } : null,
    })),
  });
}
