import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { getSentinelMode, invalidateSentinelModeCache } from '@/lib/sentinel';
import { createAuditLog } from '@/lib/audit';
import { blockIP } from '@/lib/ip-blacklist';

// Protection monitor dashboard data: recent signals, 24h stats, mode, and pending threat reviews.
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10) || 30));
  const type = searchParams.get('type') || '';
  const skip = (page - 1) * limit;
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {};
  if (type) (where as any).type = type;

  const [total, signals, byType, bans24h, wouldBans24h, pendingThreats] = await Promise.all([
    prisma.securitySignal.count({ where: where as any }),
    prisma.securitySignal.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true, role: true, banStatus: true, banUntil: true } } },
    }),
    prisma.securitySignal.groupBy({
      by: ['type'],
      where: { createdAt: { gte: dayAgo } },
      _count: { _all: true },
      _sum: { weight: true },
    }),
    prisma.auditLog.count({
      where: { action: { in: ['SENTINEL_BAN', 'SENTINEL_PROBE_BAN', 'SENTINEL_AUTO_BAN', 'SENTINEL_ADMIN_BAN'] }, createdAt: { gte: dayAgo } },
    }),
    prisma.auditLog.count({
      where: { action: { in: ['SENTINEL_WOULD_BAN', 'SENTINEL_PENDING_THREAT'] }, createdAt: { gte: dayAgo } },
    }),
    // Critical threats waiting for admin decision: "هل أحظره أم أتركه؟"
    prisma.securitySignal.findMany({
      where: {
        type: {
          in: [
            'SQL_INJECTION',
            'XSS_ATTACK',
            'PATH_TRAVERSAL',
            'SCANNER_PROBE',
            'ADMIN_PROBE',
            'HONEYPOT',
            'BRUTE_FORCE',
          ],
        },
        createdAt: { gte: threeDaysAgo },
        NOT: [
          { detail: { startsWith: '[PARDONED]' } },
          { detail: { startsWith: '[BANNED' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        user: { select: { id: true, name: true, email: true, role: true, banStatus: true, banUntil: true } },
      },
    }),
  ]);

  const { mode, stopped } = await getSentinelMode();

  return successResponse({
    signals,
    pendingThreats: pendingThreats.filter((t) => {
      // If user is already permanently banned, no decision needed
      if (t.user?.banStatus === 'PERMANENT') return false;
      return true;
    }),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    stats: {
      byType: byType.map((b) => ({ type: b.type, count: b._count._all, weight: b._sum.weight || 0 })),
      bans24h,
      wouldBans24h,
    },
    mode,
    stopped,
  });
}

// Handle Admin Decisions (Ban vs Pardon) or Toggle Mode
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return errorResponse('بيانات غير صالحة', 400);

  // 1. Admin Decision: "هل أحظره أم أتركه؟"
  if (body.action === 'decide') {
    const { decision, signalId, userId, ip, banDuration = '30d', reason } = body;
    if (decision !== 'ban' && decision !== 'pardon') {
      return errorResponse('قرار غير صالح', 400);
    }

    if (decision === 'ban') {
      const banDays = banDuration === 'permanent' ? 0 : banDuration === '7d' ? 7 : 30;
      const banUntil = banDuration === 'permanent' ? null : new Date(Date.now() + banDays * 24 * 60 * 60 * 1000);

      if (userId) {
        const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true } });
        if (targetUser && targetUser.role !== 'ADMIN') {
          await prisma.user.update({
            where: { id: userId },
            data: {
              banStatus: banDuration === 'permanent' ? 'PERMANENT' : 'TEMPORARY',
              banReason: reason || 'تم الحظر بقرار الأدمن بعد رصد محاولة اختراق أو اعتداء',
              banUntil,
              isActive: false,
            },
          });
        }
      }

      if (ip && ip !== '127.0.0.1' && ip !== '::1') {
        blockIP(ip, reason || 'محظور بقرار الأدمن عبر الحارس الأمني (Sentinel)', 30 * 24 * 60 * 60 * 1000);
      }

      if (signalId) {
        await prisma.securitySignal.update({
          where: { id: signalId },
          data: { detail: `[BANNED by Admin]: ${reason || 'تم الحظر بواسطة الأدمن'}` },
        }).catch(() => {});
      }

      await createAuditLog({
        action: 'SENTINEL_ADMIN_BAN',
        actorId: user.id,
        entityType: 'USER',
        entityId: userId || ip || 'unknown',
        description: `قرار الأدمن: حظر المعتدي (${userId || ip}) — ${reason || 'محاولة اختراق'}`,
        newValue: banDuration,
      }).catch(() => {});

      return successResponse({ success: true, message: 'تم حظر المستخدم والـ IP بنجاح' });
    }

    if (decision === 'pardon') {
      if (signalId) {
        await prisma.securitySignal.update({
          where: { id: signalId },
          data: { detail: `[PARDONED by Admin]: تم العفو وتجاهل الإنذار من قبل المدير` },
        }).catch(() => {});
      }

      await createAuditLog({
        action: 'SENTINEL_ADMIN_PARDON',
        actorId: user.id,
        entityType: 'SYSTEM',
        entityId: signalId || 'threat',
        description: `قرار الأدمن: عفو وتجاهل التهديد (${signalId || ip || userId})`,
      }).catch(() => {});

      return successResponse({ success: true, message: 'تم تجاهل الإنذار والعفو عن المستخدم' });
    }
  }

  // 2. Toggle Mode (Enforce vs Monitor) or Emergency Stop
  const data: Record<string, unknown> = {};
  if (body.mode && (body.mode === 'enforce' || body.mode === 'monitor')) {
    data.sentinelMode = body.mode;
  }
  if (typeof body.stopped === 'boolean') {
    data.sentinelStopped = body.stopped;
  }

  if (Object.keys(data).length === 0) return errorResponse('لا تغيير مطلوب', 400);

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: data as any,
    create: { id: 'default', ...(data as any) },
  });
  invalidateSentinelModeCache();

  await createAuditLog({
    action: 'SENTINEL_MODE',
    actorId: user.id,
    entityType: 'SYSTEM',
    entityId: 'sentinel',
    description: `تغيير إعدادات الحارس الأمني: ${JSON.stringify(data)}`,
    newValue: JSON.stringify(data),
  }).catch(() => {});

  const { mode, stopped } = await getSentinelMode();
  return successResponse({ mode, stopped });
}
