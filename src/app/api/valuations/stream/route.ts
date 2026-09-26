import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { runIntelligenceValuation } from '@/ai/valuation/intelligence-engine';
import { getTuning } from '@/ai/valuation/tuning';
import { buildSpecFromBody } from '@/ai/valuation/request';

// POST /api/valuations/stream — same engine, real-time stage events (spec §12).
// Events: stage {stageAr, detail, ms} → explaining → done {payload} | error {message}.
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user) {
    return new Response(`event: error\ndata: ${JSON.stringify({ message: 'تسجيل الدخول مطلوب' })}\n\n`, {
      status: 401, headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  const tuning = await getTuning().catch(() => ({ dailyQuota: 5 }));
  if (user.role !== 'ADMIN') {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const used = await prisma.valuationRequest.count({
      where: { userId: user.id, createdAt: { gte: dayAgo } },
    }).catch(() => 0);
    if (used >= tuning.dailyQuota) {
      return new Response(`event: error\ndata: ${JSON.stringify({ message: `تجاوزت الحد اليومي (${tuning.dailyQuota})` })}\n\n`, {
        status: 429, headers: { 'Content-Type': 'text/event-stream' },
      });
    }
  }

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return new Response(`event: error\ndata: ${JSON.stringify({ message: 'طلب غير صالح' })}\n\n`, {
      status: 400, headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, event: string, data: unknown) => {
    try {
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    } catch { /* closed */ }
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const built = await buildSpecFromBody(body);
        const s24 = await runIntelligenceValuation(
          { carId: built.carId, spec: built.spec },
          {
            userId: user.id,
            askingPriceOverride: built.targetPrice,
            onStage: (s) => send(controller, 'stage', s),
          }
        );

        if (s24.status === 'INSUFFICIENT_DATA' || !s24.fairMarketValue) {
          send(controller, 'done', {
            status: 'INSUFFICIENT',
            section24: s24,
            reason: s24.warnings[0] || 'البيانات غير كافية لإنتاج تقييم عادل',
            comparablesFound: s24.marketEvidence.totalListings,
            sources: [],
          });
          controller.close();
          return;
        }

        const legacyReport = {
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
        };

        send(controller, 'done', {
          status: s24.status,
          section24: s24,
          report: legacyReport,
          comparables: s24.comparablesUsed,
          rejected: s24.marketEvidence.excludedListings,
          sources: [],
        });
      } catch (e: any) {
        send(controller, 'error', { message: e?.message || 'فشل التحليل' });
      }
      controller.close();
    },
    cancel() { /* client disconnected */ },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
