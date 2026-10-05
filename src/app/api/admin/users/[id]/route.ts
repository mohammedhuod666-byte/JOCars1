import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateRequest, hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, validationErrorResponse } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';
import { sendWhatsAppToUser, buildUserMessage } from '@/lib/whatsapp';

// Detail view for the admin side drawer: profile + recent listings +
// reports filed against their cars + risk signals.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await authenticateRequest(request);
  if (!actor || actor.role !== 'ADMIN') return unauthorizedResponse();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      isActive: true, canPost: true, banStatus: true, banReason: true, banUntil: true,
      lastLoginAt: true, lastLoginIp: true, lastSeenAt: true, failedLoginAttempts: true,
      dealerName: true, rating: true, ratingCount: true, createdAt: true, badges: true,
      cars: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, slug: true, price: true, year: true, status: true, createdAt: true,
          brand: { select: { nameAr: true } }, model: { select: { nameAr: true } } },
      },
      _count: { select: { cars: true } },
    },
  });
  if (!user) return notFoundResponse('المستخدم');

  const carIds = user.cars.map((c) => c.id);
  const [pendingReports, totalReports] = await Promise.all([
    carIds.length > 0 ? prisma.report.count({ where: { carId: { in: carIds }, status: 'PENDING' } }) : 0,
    carIds.length > 0 ? prisma.report.count({ where: { carId: { in: carIds } } }) : 0,
  ]);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const risk: string[] = [];
  if (new Date(user.createdAt).getTime() > weekAgo && user._count.cars >= 3) risk.push(`حساب جديد (${user._count.cars} إعلانات بأقل من أسبوع)`);
  if ((user.failedLoginAttempts || 0) >= 3) risk.push(`محاولات دخول فاشلة متكررة (${user.failedLoginAttempts})`);
  if (pendingReports > 0) risk.push(`${pendingReports} بلاغات معلقة على إعلاناته`);
  if (user.banStatus) risk.push('سبق حظره');

  return successResponse({ ...user, pendingReports, totalReports, risk });
}

const roleBanSchema = z.object({
  role: z.enum(['USER', 'DEALER', 'TRADER', 'ADMIN'], { errorMap: () => ({ message: 'الدور غير صالح' }) }).optional(),
  banStatus: z.enum(['PERMANENT', 'TEMPORARY'], { errorMap: () => ({ message: 'حالة الحظر غير صالحة' }) }).nullable().optional(),
  banReason: z.string().max(500, 'سبب الحظر طويل جدا').nullable().optional(),
  banUntil: z.union([z.coerce.date(), z.null()]).optional(),
}).passthrough();

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await authenticateRequest(request);
  if (!actor || actor.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const roleBanParsed = roleBanSchema.safeParse(body);
    if (!roleBanParsed.success) return validationErrorResponse(roleBanParsed.error);
    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) return notFoundResponse('المستخدم');

    const allowedFields = [
      'name', 'phone', 'role', 'isActive', 'canPost', 'banStatus', 'banReason',
      'banUntil', 'badges', 'dealerName', 'dealerLogo', 'dealerDescription',
      'dealerAddress', 'dealerVerified', 'whatsappNotifications', 'forumBannedCommentUntil',
      'forumBannedTopicUntil', 'carCommentBannedUntil',
    ];
    const safeData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) safeData[key] = body[key];
    }

    // Email change (any account including admins) — must stay unique
    if (typeof body.email === 'string' && body.email.trim() && body.email.trim() !== oldUser.email) {
      const email = body.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return errorResponse('البريد الإلكتروني غير صالح', 400);
      }
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken && taken.id !== id) {
        return errorResponse('البريد الإلكتروني مستخدم لحساب آخر', 400);
      }
      safeData.email = email;
    }

    // Password reset by admin (any account including admins)
    let passwordChanged = false;
    if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 6) {
        return errorResponse('كلمة السر الجديدة قصيرة (6 أحرف على الأقل)', 400);
      }
      safeData.password = await hashPassword(body.password);
      passwordChanged = true;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: safeData,
      select: { id: true, name: true, email: true, role: true, isActive: true, canPost: true,
        badges: true, banStatus: true, banReason: true, banUntil: true,
        dealerVerified: true, dealerName: true },
    });

    if (body.banStatus || body.banStatus === null) {
      const wasBanned = oldUser.banStatus !== null;
      const nowBanned = body.banStatus !== null;
      if (nowBanned && !wasBanned) {
        await createAuditLog({
          action: 'BAN_USER', actorId: actor.id,
          entityType: 'USER', entityId: id,
          description: `حظر المستخدم ${oldUser.name} ${body.banReason ? `(السبب: ${body.banReason})` : ''}`,
          oldValue: oldUser.banStatus || 'نشط', newValue: body.banStatus,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        });
      } else if (!nowBanned && wasBanned) {
        await createAuditLog({
          action: 'UNBAN_USER', actorId: actor.id,
          entityType: 'USER', entityId: id,
          description: `إلغاء حظر المستخدم ${oldUser.name}`,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        });
      }
    }

    if (body.role && body.role !== oldUser.role) {
      await createAuditLog({
        action: 'UPDATE_USER_ROLE', actorId: actor.id,
        entityType: 'USER', entityId: id,
        description: `تغيير صلاحية المستخدم ${oldUser.name} من ${oldUser.role} إلى ${body.role}`,
        oldValue: oldUser.role, newValue: body.role,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      });
    }

    if (safeData.email && safeData.email !== oldUser.email) {
      await createAuditLog({
        action: 'UPDATE_USER_EMAIL', actorId: actor.id,
        entityType: 'USER', entityId: id,
        description: `تغيير بريد المستخدم ${oldUser.name} من ${oldUser.email} إلى ${safeData.email}`,
        oldValue: oldUser.email, newValue: safeData.email,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      });
    }

    if (passwordChanged) {
      await createAuditLog({
        action: 'RESET_USER_PASSWORD', actorId: actor.id,
        entityType: 'USER', entityId: id,
        description: `إعادة تعيين كلمة سر المستخدم ${oldUser.name} بواسطة الإدارة`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      });
    }

    if (body.banStatus && !oldUser.banStatus) {
      sendWhatsAppToUser(id, buildUserMessage('user_banned', { reason: body.banReason || '', banUntil: body.banUntil ? new Date(body.banUntil).toLocaleDateString('ar-JO') : '' }));
    } else if (!body.banStatus && oldUser.banStatus) {
      sendWhatsAppToUser(id, buildUserMessage('user_unbanned', {}));
    }

    if (body.canPost === false && oldUser.canPost !== false) {
      sendWhatsAppToUser(id, buildUserMessage('user_suspended', {}));
    } else if (body.canPost === true && oldUser.canPost !== true) {
      sendWhatsAppToUser(id, buildUserMessage('user_activated', {}));
    }

    if (body.isActive === false && oldUser.isActive !== false) {
      sendWhatsAppToUser(id, '🚫 *JO Cars - تعطيل الحساب*\n\nتم تعطيل حسابك. للتواصل مع الإدارة: ' + (process.env.NEXT_PUBLIC_APP_URL || 'https://jocars.com') + '/tickets');
    }

    return successResponse(updated);
  } catch (error) {
    return errorResponse('فشل تحديث المستخدم', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await authenticateRequest(request);
  if (!actor || actor.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) return notFoundResponse('المستخدم');

    // Destructive guardrails: user deletion cascades to cars, messages,
    // conversations and more. Refuse self-delete and require explicit
    // ?force=true when the account owns any content.
    if (actor.id === id) {
      return errorResponse('لا يمكنك حذف حسابك الخاص من هنا', 400);
    }
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';
    if (!force) {
      const [cars, parts, workshops, plates, articles, wanted, conversations] = await Promise.all([
        prisma.car.count({ where: { userId: id } }),
        prisma.usedPart.count({ where: { userId: id } }),
        prisma.workshop.count({ where: { userId: id } }),
        prisma.plate.count({ where: { sellerId: id } }),
        prisma.article.count({ where: { authorId: id } }),
        prisma.wantedAd.count({ where: { userId: id } }),
        prisma.conversation.count({ where: { OR: [{ buyerId: id }, { sellerId: id }] } }),
      ]);
      const owned = cars + parts + workshops + plates + articles + wanted + conversations;
      if (owned > 0) {
        return errorResponse(
          `هذا الحساب يملك محتوى (${owned} عنصر: إعلانات/محادثات/غيرها) وسيُحذف معه نهائيا. أعد الطلب مع force=true للتأكيد`,
          409
        );
      }
    }

    sendWhatsAppToUser(id, buildUserMessage('user_deleted', {}));

    await prisma.user.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE_USER', actorId: actor.id,
      entityType: 'USER', entityId: id,
      description: `حذف المستخدم ${oldUser.name}`,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse('فشل حذف المستخدم', 500);
  }
}
