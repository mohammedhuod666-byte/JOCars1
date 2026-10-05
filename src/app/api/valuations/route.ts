import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { runIntelligenceValuation } from '@/ai/valuation/intelligence-engine';
import { historyForCar } from '@/ai/valuation/engine';
import { getTuning } from '@/ai/valuation/tuning';
import { buildSpecFromBody } from '@/ai/valuation/request';
import type { VehicleSpec } from '@/ai/valuation/types';

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user) return unauthorizedResponse();

  // Daily quota (DB-backed, works across instances). Admins exempt.
  const tuning = await getTuning().catch(() => ({ dailyQuota: 5 }));
  if (user.role !== 'ADMIN') {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const used = await prisma.valuationRequest.count({
      where: { userId: user.id, createdAt: { gte: dayAgo } },
    }).catch(() => 0);
    if (used >= tuning.dailyQuota) {
      return errorResponse(`تجاوزت الحد اليومي (${tuning.dailyQuota} تقييمات) — عاود غداً`, 429);
    }
  }

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return errorResponse('طلب غير صالح', 400);
  }

  let spec: VehicleSpec | null = null;
  let carId: string | null = null;
  let targetPrice: number | null = null;

  try {
    const built = await buildSpecFromBody(body);
    spec = built.spec;
    carId = built.carId;
    targetPrice = built.targetPrice;

    const s24 = await runIntelligenceValuation(
      { carId, spec },
      { userId: user.id, askingPriceOverride: targetPrice }
    );

    if (s24.status === 'INSUFFICIENT_DATA') {
      return successResponse({
        status: 'INSUFFICIENT',
        section24: s24,
        reason: s24.warnings[0] || 'بيانات السوق غير كافية لإنتاج تقييم عادل موثوق',
        comparablesFound: s24.marketEvidence.totalListings,
        sources: [],
      });
    }

    const legacyReport = s24.fairMarketValue ? {
      estimatedPrice: s24.fairMarketValue,
      minPrice: s24.range.low ?? s24.fairMarketValue,
      maxPrice: s24.range.high ?? s24.fairMarketValue,
      grade: s24.status.toLowerCase(),
      confidence: s24.confidence,
      confidenceLabel: s24.confidence >= 70 ? 'مرتفعة' : s24.confidence >= 40 ? 'متوسطة' : 'محدودة',
      confidenceReasons: s24.warnings,
      comparablesUsed: s24.comparablesUsed.length,
      comparablesFound: s24.marketEvidence.totalListings,
      sourcesUsed: s24.marketEvidence.uniqueSources,
      sources: [],
      stats: { weightedMedian: s24.fairMarketValue },
      factors: [],
      explanation: s24.reasoning.join('\n'),
      pipeline: [],
      calculatedAt: new Date().toISOString(),
      targetDiffPct: s24.pricePosition.differencePercent,
    } : null;

    return successResponse({
      status: s24.status,
      section24: s24,
      report: legacyReport,
      comparables: s24.comparablesUsed,
      rejected: s24.marketEvidence.excludedListings,
      sources: [],
    });
  } catch (e: any) {
    return errorResponse(e?.message || 'فشل التحليل', e?.status || 500);
  }
}

// GET /api/valuations?carId= — Section 24 intelligence valuation + price history graph data.
export async function GET(request: NextRequest) {
  const carId = request.nextUrl.searchParams.get('carId');
  if (!carId) return errorResponse('carId مطلوب', 400);
  try {
    const [s24, history] = await Promise.all([
      runIntelligenceValuation({ carId }),
      historyForCar(carId).catch(() => []),
    ]);

    if (s24.status === 'INSUFFICIENT_DATA') {
      return successResponse({
        status: 'INSUFFICIENT',
        section24: s24,
        latest: null,
        history,
      });
    }

    const latest = s24.fairMarketValue ? {
      estimatedPrice: s24.fairMarketValue,
      minPrice: s24.range.low ?? s24.fairMarketValue,
      maxPrice: s24.range.high ?? s24.fairMarketValue,
      grade: s24.status.toLowerCase(),
      confidence: s24.confidence,
      confidenceLabel: s24.confidence >= 70 ? 'مرتفعة' : s24.confidence >= 40 ? 'متوسطة' : 'محدودة',
      confidenceReasons: s24.warnings,
      comparablesUsed: s24.comparablesUsed.length,
      comparablesFound: s24.marketEvidence.totalListings,
      sourcesUsed: s24.marketEvidence.uniqueSources,
      sources: [],
      stats: { weightedMedian: s24.fairMarketValue },
      factors: [],
      explanation: s24.reasoning.join('\n'),
      pipeline: [],
      calculatedAt: new Date().toISOString(),
      targetDiffPct: s24.pricePosition.differencePercent,
      comparables: s24.comparablesUsed,
    } : null;

    return successResponse({
      status: s24.status,
      section24: s24,
      latest,
      history,
    });
  } catch (err: any) {
    return errorResponse(err?.message || 'فشل التحميل', 500);
  }
}
