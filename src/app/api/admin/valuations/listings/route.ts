import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { parseKilometers, toJod, normalizeTrim, contentHash } from '@/ai/valuation/normalize';

const manualSchema = z.object({
  url: z.string().max(2000).optional(),
  brand: z.string().min(1).max(100),
  brandEn: z.string().max(100).optional(),
  model: z.string().min(1).max(100),
  modelEn: z.string().max(100).optional(),
  year: z.coerce.number().int().min(1990).max(2030),
  trim: z.string().max(40).optional(),
  kilometers: z.coerce.number().int().min(0).max(1000000),
  price: z.coerce.number().positive(),
  currency: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  fuelType: z.string().max(30).optional(),
  transmission: z.string().max(30).optional(),
  condition: z.string().max(30).optional(),
});

// Admin-curated market listing (source 'manual'): verified comps that fill
// thin markets where scrapers find too few rows. Fully labeled as manual.
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const parsed = manualSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse(parsed.error);
  const b = parsed.data;

  const km = parseKilometers(b.kilometers) || b.kilometers;
  const { priceJod, fxRate } = toJod(b.price, b.currency || 'JOD');
  const hash = contentHash(['manual', b.brandEn || b.brand, b.modelEn || b.model, b.year, km, priceJod, b.city]);

  const row = await prisma.marketListing.create({
    data: {
      source: 'manual',
      externalId: `manual-${hash}`,
      url: b.url || null,
      brand: b.brand, brandEn: b.brandEn || null,
      model: b.model, modelEn: b.modelEn || null,
      year: b.year, trim: normalizeTrim(b.trim),
      kilometers: km, price: b.price, currency: b.currency || 'JOD',
      priceJod, fxRate, city: b.city || null, country: 'JO',
      fuelType: b.fuelType || null, transmission: b.transmission || null,
      condition: b.condition || null, specs: '[]',
      scrapedAt: new Date(), lastSeenAt: new Date(),
      contentHash: hash, status: 'ACTIVE', priceType: 'asking',
    },
  }).catch(() => null);

  if (!row) return errorResponse('تعذر الحفظ (مكرر؟)', 400);
  return successResponse(row, 201);
}
