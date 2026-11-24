import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'اختر مستخدماً واحداً على الأقل').max(100, 'الحد الأقصى 100 مستخدم'),
  action: z.enum(['unban', 'activate', 'deactivate', 'canpost_on', 'canpost_off', 'ban_perm', 'ban_temp']),
  banReason: z.string().max(500).optional(),
  banDays: z.coerce.number().int().min(1).max(365).optional(),
});

const ACTION_LABEL: Record<string, string> = {
  unban: 'إلغاء الحظر', activate: 'تفعيل الحسابات', deactivate: 'تعطيل الحسابات',
  canpost_on: 'تفعيل النشر', canpost_off: 'إيقاف النشر',
  ban_perm: 'حظر دائم', ban_temp: 'حظر مؤقت',
};

// Bulk moderation for the admin users table. Never touches the actor's own
// account; never bans fellow ADMINs. One audit entry per batch.
export async function POST(request: NextRequest) {
  const actor = await authenticateRequest(request);
  if (!actor || actor.role !== 'ADMIN') return unauthorizedResponse();

  const parsed = bulkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse(parsed.error);
  const { ids, action, banReason, banDays } = parsed.data;

  const targets = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, role: true, name: true },
  });
  // Safety rails: skip self + other admins for destructive actions.
  const destructive = action !== 'activate' && action !== 'canpost_on' && action !== 'unban';
  const eligible = targets.filter((t) => t.id !== actor.id && (!destructive || t.role !== 'ADMIN'));
  if (eligible.length === 0) return errorResponse('لا يوجد مستخدمون صالحون لهذا الإجراء', 400);
  const eligibleIds = eligible.map((t) => t.id);

  // HTTP adapter لا يدعم updateMany — نبني جملة UPDATE واحدة معلّمة بدلها
  // (القيم parameterized، والفتحة من enum مفحوص بـ zod أعلاه).
  let setSql: Prisma.Sql;
  if (action === 'unban') setSql = Prisma.sql`"banStatus" = NULL, "banReason" = NULL, "banUntil" = NULL, "isActive" = true`;
  else if (action === 'activate') setSql = Prisma.sql`"isActive" = true`;
  else if (action === 'deactivate') setSql = Prisma.sql`"isActive" = false`;
  else if (action === 'canpost_on') setSql = Prisma.sql`"canPost" = true`;
  else if (action === 'canpost_off') setSql = Prisma.sql`"canPost" = false`;
  else if (action === 'ban_perm') setSql = Prisma.sql`"banStatus" = 'PERMANENT', "banReason" = ${banReason || null}, "banUntil" = NULL, "isActive" = false`;
  else setSql = Prisma.sql`"banStatus" = 'TEMPORARY', "banReason" = ${banReason || null}, "banUntil" = ${new Date(Date.now() + (banDays || 7) * 24 * 60 * 60 * 1000)}, "isActive" = false`;

  const count = await prisma.$executeRaw(
    Prisma.sql`UPDATE "users" SET ${setSql} WHERE "id" IN (${Prisma.join(eligibleIds)})`
  );

  await createAuditLog({
    action: 'BULK_USER_UPDATE', actorId: actor.id,
    entityType: 'USER', entityId: eligibleIds.join(','),
    description: `${ACTION_LABEL[action]} جماعي لـ ${eligibleIds.length} مستخدم${banReason ? ` (السبب: ${banReason})` : ''}`,
    newValue: action,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
  }).catch(() => {});

  return successResponse({ updated: count, skipped: ids.length - eligibleIds.length });
}
