import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';
import { isCronAuthorized } from '@/lib/cron-auth';
import { isWeeklyJob, describeSchedule } from '@/lib/cron-guard';
import { sendWhatsAppToAdmins, isWhatsAppConfigured } from '@/lib/whatsapp';

/**
 * Weekly admin report via WhatsApp — called by server.js every 7 days.
 * Guarded by BACKUP_CRON_SECRET (shared scheduler secret).
 */
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!process.env.BACKUP_CRON_SECRET) {
    return errorResponse('الجدولة غير مفعّلة: حدّد BACKUP_CRON_SECRET في البيئة', 503);
  }

  if (!isCronAuthorized(request)) {
    return errorResponse('غير مصرح', 403);
  }

  // Workers cron cannot express "every Sunday": it rejects a day-of-week field
  // outright (API code 10100, "invalid cron string: 0 4 * * 0"), so the schedule
  // fires daily at 04:00 UTC and this guard makes it weekly. See lib/cron-guard.ts.
  //
  // The check runs AFTER authorization deliberately: it must not become an
  // unauthenticated oracle for the current date. It also happens before any query so
  // a skipped day costs one date comparison and no database work at all.
  if (!isWeeklyJob()) {
    return successResponse({
      skipped: true,
      reason: 'weekly job: not Sunday (UTC)',
      now: describeSchedule(),
      ran: false,
    });
  }

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      newUsers, newCars, newConversations, newMessages,
      pendingCars, pendingReports, pendingTraders, soldCars,
      totalUsers, totalCars, totalDealers,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
      prisma.car.count({ where: { createdAt: { gte: since }, deletedAt: null } }).catch(() => 0),
      prisma.conversation.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
      prisma.message.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
      prisma.car.count({ where: { status: 'PENDING', deletedAt: null } }).catch(() => 0),
      prisma.report.count({ where: { status: 'PENDING' } }).catch(() => 0),
      prisma.traderVerification.count({ where: { status: 'PENDING' } }).catch(() => 0),
      prisma.car.count({ where: { status: 'SOLD', soldAt: { gte: since } } }).catch(() => 0),
      prisma.user.count({}).catch(() => 0),
      prisma.car.count({ where: { status: 'APPROVED', deletedAt: null } }).catch(() => 0),
      prisma.user.count({ where: { role: { in: ['TRADER', 'DEALER'] } } }).catch(() => 0),
    ]);

    const when = new Intl.DateTimeFormat('ar-JO', {
      timeZone: 'Asia/Amman', year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date());

    const msg =
      ` *JO Cars — التقرير الأسبوعي* (${when})\n\n` +
      `🆕 خلال 7 أيام:\n` +
      `• مستخدمون جدد: ${newUsers}\n` +
      `• إعلانات جديدة: ${newCars}\n` +
      `• محادثات: ${newConversations} | رسائل: ${newMessages}\n` +
      `• سيارات مباعة: ${soldCars}\n\n` +
      ` بانتظار المراجعة:\n` +
      `• إعلانات معلقة: ${pendingCars}\n` +
      `• بلاغات: ${pendingReports}\n` +
      `• طلبات توثيق تجار: ${pendingTraders}\n\n` +
      ` الإجمالي: ${totalUsers} مستخدم (${totalDealers} تاجر) | ${totalCars} إعلان نشط`;

    let sent = false;
    if (isWhatsAppConfigured()) {
      await sendWhatsAppToAdmins(msg);
      sent = true;
    }

    return successResponse({ sent, stats: { newUsers, newCars, newConversations, newMessages, pendingCars, pendingReports, pendingTraders, soldCars, totalUsers, totalCars, totalDealers } });
  } catch (error) {
    return errorResponse('فشل إنشاء التقرير الأسبوعي', 500);
  }
}

export async function GET(request: NextRequest) {
  // Vercel Cron fires GET + Authorization: Bearer <CRON_SECRET> — run the job
  // only when authorized; unauthenticated callers just see the schedule info.
  if (process.env.BACKUP_CRON_SECRET && isCronAuthorized(request)) return POST(request);
  return successResponse({ schedule: 'every 7 days', enabled: Boolean(process.env.BACKUP_CRON_SECRET) });
}
