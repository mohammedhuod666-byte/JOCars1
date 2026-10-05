import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { descriptionGenerator } from '@/ai/description-generator';
import { successResponse, errorResponse } from '@/lib/api';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`ai-desc:${ip}`, RATE_LIMITS.AI);
    if (!rateLimit.allowed) return errorResponse('تم تجاوز الحد المسموح', 429);

    const body = await request.json();
    // The add-car form sends brandId/modelId (not names) — resolve them.
    let brandName: string = body.brandName || '';
    let modelName: string = body.modelName || '';
    try {
      if (!brandName && body.brandId) {
        const b = await prisma.brand.findUnique({ where: { id: body.brandId }, select: { nameAr: true } });
        if (b) brandName = b.nameAr;
      }
      if (!modelName && body.modelId) {
        const m = await prisma.carModel.findUnique({ where: { id: body.modelId }, select: { nameAr: true } });
        if (m) modelName = m.nameAr;
      }
    } catch { /* name resolution is best-effort */ }
    const result = await descriptionGenerator.process({
      brand: brandName,
      model: modelName,
      year: body.year || new Date().getFullYear(),
      kilometers: body.kilometers || 0,
      fuelType: body.fuelType || '',
      transmission: body.transmission || '',
      color: body.color || '',
      condition: body.condition || '',
      price: body.price || 0,
      features: [],
      currentDescription: body.description,
      trim: body.trim || '',
      bodyType: body.bodyType || '',
      engineCapacity: body.engineCapacity || '',
      ownerCount: body.ownerCount || 1,
      hasWarranty: body.hasWarranty || false,
      hasServiceHistory: body.hasServiceHistory || false,
      isNegotiable: body.isNegotiable || false,
      isDamaged: body.isDamaged || false,
      isPaintOriginal: body.isPaintOriginal !== undefined ? body.isPaintOriginal : true,
    });

    return successResponse(result.data);
  } catch (error) {
    console.error('Description generation error:', error);
    return errorResponse('فشل تحسين الوصف', 500);
  }
}
