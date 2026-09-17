import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';

/**
 * GET /api/deals — today's deals: APPROVED cars priced ≥5% below their
 * AI fair-price estimate, ranked by discount. Updates automatically.
 */
export async function GET(request: NextRequest) {
  try {
    const limit = Math.min(48, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '24')));

    const cars = await prisma.car.findMany({
      where: { status: 'APPROVED', deletedAt: null, fairPriceEstimate: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true, slug: true, price: true, year: true, kilometers: true,
        fuelType: true, fairPriceEstimate: true, createdAt: true,
        brand: { select: { nameAr: true, nameEn: true } },
        model: { select: { nameAr: true, nameEn: true } },
        city: { select: { nameAr: true } },
        images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
      },
    });

    const deals = cars
      .map((c) => {
        const est = c.fairPriceEstimate || 0;
        const diffPct = est > 0 ? Math.round(((est - c.price) / est) * 100) : 0;
        return { ...c, diffPct, saveAmount: Math.round(est - c.price) };
      })
      .filter((c) => c.diffPct >= 5)
      .sort((a, b) => b.diffPct - a.diffPct)
      .slice(0, limit);

    return successResponse({ deals, total: deals.length });
  } catch {
    return errorResponse('فشل تحميل الصفقات', 500);
  }
}
