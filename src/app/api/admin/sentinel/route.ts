import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { getSentinelMode, invalidateSentinelModeCache } from '@/lib/sentinel';
import { createAuditLog } from '@/lib/audit';

// Protection monitor dashboard data: recent signals, 24h stats, mode.
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10) || 30));
  const type = searchParams.get('type') || '';
  const skip = (page - 1) * limit;
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {};
  if (type) (where as any).type = type;

  const [total, signals, byType, bans24h, wouldBans24h] = await Promise.all([
    prisma.securitySignal.count({ where: where as any }),
    prisma.securitySignal.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
      include: { user: { select: { id: true, name: true, email: true, role: true, banStatus: true } } },
    }),
    prisma.securitySignal.groupBy({
      by: ['type'],
      where: { createdAt: { gte: dayAgo } },
      _count: { _all: true },
      _sum: { weight: true },
    }),
    prisma.auditLog.count({
      where: { action: { in: ['SENTINEL_BAN', 'SENTINEL_PROBE_BAN'] }, createdAt: { gte: dayAgo } },
    }),
    prisma.auditLog.count({
      where: { action: 'SENTINEL_WOULD_BAN', createdAt: { gte: dayAgo } },
    }),
  ]);

  const { mode, stopped } = await getSentinelMode();

  return successResponse({
    signals, total, page, limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    stats: {
      byType: byType.map((b) => ({ type: b.type, count: b._count._all, weight: b._sum.weight || 0 })),
      bans24h, wouldBans24h,
    },
    mode, stopped,
  });
}

const modeSchema = z.object({
  mode: z.enum(['monitor', 'enforce']).optional(),
  stopped: z.boolean().optional(),
});

// Toggle mode (monitor/enforce) or the emergency kill-switch.
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const parsed = modeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const data: Record<string, unknown> = {};
  if (parsed.data.mode) data.sentinelMode = parsed.data.mode;
  if (typeof parsed.data.stopped === 'boolean') data.sentinelStopped = parsed.data.stopped;
  if (Object.keys(data).length === 0) return errorResponse('لا تغيير مطلوب', 400);

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: data as any,
    create: { id: 'default', ...(data as any) },
  });
  invalidateSentinelModeCache();

  await createAuditLog({
    action: 'SENTINEL_MODE', actorId: user.id,
    entityType: 'SYSTEM', entityId: 'sentinel',
    description: `تغيير وضع الحارس: ${JSON.stringify(data)}`,
    newValue: JSON.stringify(data),
  }).catch(() => {});

  const { mode, stopped } = await getSentinelMode();
  return successResponse({ mode, stopped });
}
