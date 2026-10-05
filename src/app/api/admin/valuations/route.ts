import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { getTuning, invalidateTuningCache } from '@/ai/valuation/tuning';

// Admin valuation observatory (spec: عمليات، مصادر، مقارنات، مستورد،
 // أخطاء، مشكوك، أداء، إعدادات).
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'requests';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
  const skip = (page - 1) * limit;

  try {
    if (view === 'requests' || view === 'errors') {
      const where: Record<string, unknown> =
        view === 'errors' ? { status: { in: ['FAILED', 'INSUFFICIENT'] } } : {};
      const [total, rows] = await Promise.all([
        prisma.valuationRequest.count({ where: where as any }),
        prisma.valuationRequest.findMany({
          where: where as any,
          orderBy: { createdAt: 'desc' },
          skip, take: limit,
          include: {
            result: { select: { estimatedPrice: true, confidence: true, confidenceLabel: true, comparablesUsed: true, sourcesUsed: true } },
            user: { select: { id: true, name: true, email: true } },
            _count: { select: { comparables: true } },
          },
        }),
      ]);
      return successResponse({ total, page, totalPages: Math.max(1, Math.ceil(total / limit)), rows });
    }

    if (view === 'listings') {
      const source = searchParams.get('source') || '';
      const where: Record<string, unknown> = {};
      if (source) (where as any).source = source;
      const [total, rows, bySource] = await Promise.all([
        prisma.marketListing.count({ where: where as any }),
        prisma.marketListing.findMany({ where: where as any, orderBy: { scrapedAt: 'desc' }, skip, take: limit }),
        prisma.marketListing.groupBy({ by: ['source', 'status'], _count: { _all: true } }),
      ]);
      return successResponse({ total, page, totalPages: Math.max(1, Math.ceil(total / limit)), rows, bySource });
    }

    if (view === 'dubious') {
      // Low confidence OR wide spread relative to estimate.
      const rows = await prisma.valuationResult.findMany({
        where: { confidence: { lt: 50 } },
        orderBy: { calculatedAt: 'desc' },
        take: limit, skip,
        include: { request: { select: { id: true, createdAt: true, user: { select: { name: true } } } } },
      });
      const total = await prisma.valuationResult.count({ where: { confidence: { lt: 50 } } });
      return successResponse({ total, page, totalPages: Math.max(1, Math.ceil(total / limit)), rows });
    }

    if (view === 'perf') {
      const [totalReq, doneReq, avgConf, avgUsed, byDay] = await Promise.all([
        prisma.valuationRequest.count(),
        prisma.valuationRequest.count({ where: { status: { in: ['RELIABLE', 'LIMITED', 'APPROXIMATE'] } } }),
        prisma.valuationResult.aggregate({ _avg: { confidence: true, comparablesUsed: true } }),
        prisma.valuationResult.aggregate({ _avg: { comparablesUsed: true } }),
        prisma.$queryRaw<{ d: string; n: bigint; c: number | null }[]>`
          SELECT to_char("calculatedAt", 'YYYY-MM-DD') AS d,
                 COUNT(*)::int AS n,
                 AVG(confidence)::float AS c
          FROM valuation_results
          WHERE "calculatedAt" >= NOW() - INTERVAL '14 days'
          GROUP BY 1 ORDER BY 1`,
      ]);
      void avgUsed;
      return successResponse({
        totalReq, doneReq,
        avgConfidence: Math.round(avgConf._avg.confidence || 0),
        avgComparables: Math.round(avgConf._avg.comparablesUsed || 0),
        byDay: byDay.map((r) => ({ day: r.d, count: Number(r.n), avgConfidence: r.c === null ? null : Math.round(r.c) })),
      });
    }

    if (view === 'config') {
      const [row, tuning] = await Promise.all([
        prisma.valuationConfig.findUnique({ where: { id: 'default' } }),
        getTuning(),
      ]);
      return successResponse({ stored: row, effective: tuning });
    }

    return errorResponse('view غير معروف', 400);
  } catch {
    return errorResponse('فشل التحميل', 500);
  }
}

const configSchema = z.object({
  simWeights: z.record(z.string(), z.number().min(0).max(100)).optional(),
  minIncluded: z.coerce.number().int().min(3).max(30).optional(),
  minRangeOnly: z.coerce.number().int().min(2).max(10).optional(),
  dailyQuota: z.coerce.number().int().min(1).max(100).optional(),
  staleDays: z.coerce.number().int().min(7).max(365).optional(),
});

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request).catch(() => null);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const parsed = configSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const data: Record<string, unknown> = {};
  if (parsed.data.simWeights) {
    const sum = Object.values(parsed.data.simWeights).reduce((a, b) => a + b, 0);
    if (sum <= 0) return errorResponse('مجموع الأوزان يجب أن يكون موجباً', 400);
    data.simWeights = JSON.stringify(parsed.data.simWeights);
  }
  for (const k of ['minIncluded', 'minRangeOnly', 'dailyQuota', 'staleDays'] as const) {
    if (parsed.data[k] !== undefined) (data as any)[k] = parsed.data[k];
  }
  if (Object.keys(data).length === 0) return errorResponse('لا تغيير', 400);

  await prisma.valuationConfig.upsert({
    where: { id: 'default' },
    update: data as any,
    create: { id: 'default', ...(data as any) },
  });
  invalidateTuningCache();
  const tuning = await getTuning();
  return successResponse({ effective: tuning });
}
