import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { runValuation } from '@/ai/valuation/engine';
import { explainValuation } from '@/ai/valuation/explain';
import { getTuning } from '@/ai/valuation/tuning';
import { buildSpecFromBody } from '@/ai/valuation/request';
import { matchMatrix } from '@/ai/valuation/similarity';

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
        const result = await runValuation(
          built.spec,
          { carId: built.carId, userId: user.id, targetPrice: built.targetPrice },
          (s) => send(controller, 'stage', s),
        );

        if (result.status === 'INSUFFICIENT') {
          send(controller, 'done', {
            status: 'INSUFFICIENT', requestId: result.requestId,
            reason: result.insufficientReason,
            comparablesFound: result.comparables.length, sources: result.outcomes,
          });
          controller.close();
          return;
        }
        if (!result.output) {
          send(controller, 'error', { message: result.insufficientReason || 'فشل التحليل' });
          controller.close();
          return;
        }

        send(controller, 'explaining', {});
        const explanation = await explainValuation(built.spec, result.output).catch(() => null);
        if (explanation) {
          await prisma.valuationResult.updateMany({
            where: { requestId: result.requestId }, data: { explanation },
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
            matrix: matchMatrix(built.spec, c),
          }));
        send(controller, 'done', {
          status: result.status, requestId: result.requestId,
          report: { ...result.output, explanation },
          comparables: top,
          rejected: result.comparables.filter((c) => !c.included).length,
          sources: result.outcomes,
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
