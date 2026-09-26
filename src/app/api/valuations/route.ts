import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { runValuation, latestResultForCar, historyForCar } from '@/ai/valuation/engine';
import { explainValuation } from '@/ai/valuation/explain';
import { getTuning } from '@/ai/valuation/tuning';
import { buildSpecFromBody } from '@/ai/valuation/request';
import { matchMatrix } from '@/ai/valuation/similarity';
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

    const result = await runValuation(spec, { carId, userId: user.id, targetPrice });

    if (result.status !== 'RELIABLE' && result.status !== 'LIMITED' && result.status !== 'APPROXIMATE') {
      if (result.status === 'INSUFFICIENT') {
        return successResponse({
          status: 'INSUFFICIENT',
          requestId: result.requestId,
          reason: result.insufficientReason,
          comparablesFound: result.comparables.length,
          sources: result.outcomes,
        });
      }
      return errorResponse(result.insufficientReason || 'فشل التحليل', 500);
    }
    if (!result.output) {
      return errorResponse(result.insufficientReason || 'فشل التحليل', 500);
    }

    // Explanation layer (numbers-fed; never blocks the report on failure).
    const explanation = await explainValuation(spec, result.output).catch(() => null);
    if (explanation) {
      await prisma.valuationResult.updateMany({
        where: { requestId: result.requestId },
        data: { explanation },
      }).catch(() => {});
    }

    const top = [...result.comparables]
      .filter((c) => c.included)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 15)
      .map((c) => ({
        source: c.source, sourceLabel: c.sourceLabel, url: c.url,
        title: `${c.brand} ${c.model} ${c.year ?? ''}`.trim(),
        year: c.year, kilometers: c.kilometers, price: c.priceJod,
        adjustedPrice: c.adjustedPrice, similarity: c.similarity,
        simBreakdown: c.simBreakdown,
        tier: c.tier, yearDiff: c.yearDiff, weight: Math.round(c.weight * 1000) / 1000,
        adjustments: c.adjustments, ageDays: c.ageDays,
        matrix: spec ? matchMatrix(spec, c) : [],
      }));

    return successResponse({
      status: result.status,
      requestId: result.requestId,
      report: { ...result.output, explanation },
      comparables: top,
      rejected: result.comparables.filter((c) => !c.included).length,
      sources: result.outcomes,
    });
  } catch (e: any) {
    return errorResponse(e?.message || 'فشل التحليل', e?.status || 500);
  }
}

// GET /api/valuations?carId= — cached latest result + price history graph data.
export async function GET(request: NextRequest) {
  const carId = request.nextUrl.searchParams.get('carId');
  if (!carId) return errorResponse('carId مطلوب', 400);
  try {
    const [latest, history] = await Promise.all([
      latestResultForCar(carId),
      historyForCar(carId),
    ]);
    if (!latest) return successResponse({ status: 'NONE', latest: null, history });
    return successResponse({
      status: 'DONE',
      latest: {
        ...latest,
        confidenceReasons: JSON.parse(latest.confidenceReasons || '[]'),
        sources: JSON.parse(latest.sources || '[]'),
        stats: JSON.parse(latest.stats || '{}'),
        factors: JSON.parse(latest.factors || '[]'),
        pipeline: JSON.parse(latest.pipeline || '[]'),
        funnel: JSON.parse((latest as any).funnel || '[]'),
      },
      history,
    });
  } catch {
    return errorResponse('فشل التحميل', 500);
  }
}
