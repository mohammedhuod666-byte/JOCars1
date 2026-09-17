import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api';

/**
 * GET /api/users/[id]/accuracy — seller pricing accuracy:
 * average over/under-pricing vs AI fair estimates across their listings.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const seller = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!seller) return notFoundResponse('المستخدم');

    const cars = await prisma.car.findMany({
      where: { userId: id, deletedAt: null, fairPriceEstimate: { gt: 0 }, price: { gt: 0 } },
      select: { price: true, fairPriceEstimate: true, status: true },
      take: 100,
    });

    if (cars.length === 0) {
      return successResponse({ count: 0, avgOverPct: null, score: null, label: 'لا توجد بيانات كافية' });
    }

    const diffs = cars.map((c) => ((c.price - (c.fairPriceEstimate || c.price)) / (c.fairPriceEstimate || c.price)) * 100);
    const avgOverPct = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    // Score: 100 at fair-or-below, loses 3 points per 1% average overpricing
    const score = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, avgOverPct) * 3)));
    const label = score >= 85 ? 'أسعار عادلة جداً' : score >= 65 ? 'أسعار معقولة' : score >= 40 ? 'أسعار مرتفعة غالباً' : 'مبالغ بأسعاره غالباً';

    return successResponse({ count: cars.length, avgOverPct, score, label });
  } catch {
    return errorResponse('فشل حساب الدقة', 500);
  }
}
