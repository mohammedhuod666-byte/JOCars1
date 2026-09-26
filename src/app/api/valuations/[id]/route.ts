import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

// GET /api/valuations/[id] — full audit trail (spec §14).
// Owner of the request or ADMIN only.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request).catch(() => null);
  if (!user) return unauthorizedResponse();

  const req = await prisma.valuationRequest.findUnique({
    where: { id },
    include: {
      result: true,
      comparables: { orderBy: [{ included: 'desc' }, { similarity: 'desc' }] },
      car: { select: { id: true, slug: true, price: true } },
    },
  });
  if (!req) return notFoundResponse('التقييم');
  if (user.role !== 'ADMIN' && req.userId !== user.id) {
    return errorResponse('لا تملك صلاحية عرض هذا التقييم', 403);
  }

  const parse = (s: string | null, fb: any) => {
    try { return s ? JSON.parse(s) : fb; } catch { return fb; }
  };
  return successResponse({
    id: req.id,
    status: req.status,
    error: req.error,
    input: parse(req.input, {}),
    createdAt: req.createdAt,
    car: req.car,
    result: req.result ? {
      ...req.result,
      confidenceReasons: parse(req.result.confidenceReasons, []),
      sources: parse(req.result.sources, []),
      stats: parse(req.result.stats, {}),
      factors: parse(req.result.factors, []),
      pipeline: parse(req.result.pipeline, []),
      funnel: parse((req.result as any).funnel || '[]', []),
    } : null,
    comparables: req.comparables.map((c) => ({
      id: c.id,
      tier: c.tier,
      similarity: c.similarity,
      simBreakdown: parse(c.simBreakdown, {}),
      adjustedPrice: c.adjustedPrice,
      adjustments: parse(c.adjustments, []),
      weight: c.weight,
      included: c.included,
      excludeReason: c.excludeReason,
      snapshot: parse(c.snapshot, {}),
    })),
  });
}
