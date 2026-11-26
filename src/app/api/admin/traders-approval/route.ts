import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';
import { sendPushToUser } from '@/lib/push';

/**
 * Admin trader-approval queue. Mirrors the premium-requests route structure
 * but operates on the `TraderVerification` model (status PENDING|APPROVED|REJECTED).
 *
 * GET  /api/admin/traders-approval?status=PENDING  → list rows
 * POST /api/admin/traders-approval { requestId, action, rejectReason? }
 *      action: 'APPROVE' | 'REJECT'
 *      APPROVE → copies verification profile onto the User + sets
 *               `dealerVerified = true` (inside a transaction so a crash
 *               between the two writes leaves a consistent state).
 *      REJECT  → records `rejectReason` on the verification row.
 */
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const status = request.nextUrl.searchParams.get('status');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const requests = await prisma.traderVerification.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, phone: true, image: true,
            createdAt: true,
          },
        },
      },
    });

    return successResponse(requests);
  } catch (error) {
    console.error('traders-approval GET error:', error);
    return errorResponse('فشل تحميل طلبات الاعتماد', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const body = await request.json();
    const { requestId, action, rejectReason } = body as {
      requestId?: string;
      action?: string;
      rejectReason?: string;
    };

    if (!requestId || !action || !['APPROVE', 'REJECT'].includes(action)) {
      return errorResponse('بيانات غير صالحة');
    }

    const verification = await prisma.traderVerification.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!verification) return errorResponse('الطلب غير موجود', 404);
    if (verification.status !== 'PENDING') return errorResponse('تم معالجة الطلب مسبقاً');

    const now = new Date();

    if (action === 'APPROVE') {
      // HTTP adapter لا يدعم المعاملات — ننفّذ التحديثين متتاليين ونلتزم
      // بنفس قاعدة الاتّساق: نحدّث الطلب أولًا فلو تعذّر لم يبقَ قبول دون
      // تاجر معتمد، وعند فشل تراجع صف الطلب إلى PENDING (كان roll-back
      // المعاملة يلغي كلتَي الكتابتين).
      try {
        await prisma.traderVerification.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            reviewedBy: user.id,
            reviewedAt: now,
          },
        });
      } catch (approveErr) {
        // لم نكتب شيئًا — أعد الخطأ كما هو.
        throw approveErr;
      }

      try {
        // Persist the verified profile onto the User: a failure here can't
        // leave the verification row as the only approved artifact, so we
        // revert it to PENDING (compensating write for the rolled-back tx).
        // Parse existing badges and add VERIFIED_DEALER
        let existingBadges: string[] = [];
        try {
          existingBadges = JSON.parse(verification.user.badges || '[]');
        } catch {
          existingBadges = [];
        }
        if (!existingBadges.includes('VERIFIED_DEALER')) {
          existingBadges.push('VERIFIED_DEALER');
        }

        await prisma.user.update({
          where: { id: verification.userId },
          data: {
            role: 'TRADER',
            dealerVerified: true,
            dealerName: verification.dealerName,
            dealerLogo: verification.dealerLogo,
            dealerDescription: verification.dealerDescription,
            dealerAddress: verification.dealerAddress,
            dealerLat: verification.dealerLat,
            dealerLng: verification.dealerLng,
            dealerCommercialReg: verification.commercialReg,
            badges: JSON.stringify(existingBadges),
          },
        });

        // Send Push Notification + In-App notification directly to dealer's phone
        const notifTitle = 'مبروك! تم توثيق معرضك ومنحك الشارة الرسمية';
        const notifBody = `وافقت إدارة كارس جو على اعتماد معرضك (${verification.dealerName}) ومنحك الشارة الذهبية الموثقة!`;

        await prisma.notification.create({
          data: {
            userId: verification.userId,
            title: notifTitle,
            message: notifBody,
            type: 'TRADER_APPROVED',
            link: '/dealers/dashboard',
          },
        }).catch(() => {});

        await sendPushToUser(verification.userId, {
          title: notifTitle,
          body: notifBody,
          url: '/dealers/dashboard',
        }).catch(() => {});
      } catch (userErr) {
        await prisma.traderVerification.update({
          where: { id: requestId },
          data: { status: 'PENDING', reviewedBy: null, reviewedAt: null },
        }).catch(() => {});
        throw userErr;
      }
    } else {
      // REJECT — persist the rejectReason so we can show the applicant why.
      await prisma.traderVerification.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectReason: rejectReason || 'لم يحدد سبب',
          reviewedBy: user.id,
          reviewedAt: now,
        },
      });

      // Send rejection notification to dealer
      const rejTitle = 'إشعار بخصوص طلب توثيق المعرض';
      const rejBody = `تمت مراجعة طلب توثيق معرضك من الإدارة: ${rejectReason || 'يرجى مراجعة وتحديث البيانات المطلوبة'}`;

      await prisma.notification.create({
        data: {
          userId: verification.userId,
          title: rejTitle,
          message: rejBody,
          type: 'TRADER_REJECTED',
          link: '/dealers/dashboard',
        },
      }).catch(() => {});

      await sendPushToUser(verification.userId, {
        title: rejTitle,
        body: rejBody,
        url: '/dealers/dashboard',
      }).catch(() => {});
    }

    await createAuditLog({
      action: action === 'APPROVE' ? 'TRADER_APPROVE' : 'TRADER_REJECT', actorId: user.id,
      entityType: 'TRADER_VERIFICATION', entityId: requestId,
      description: `${action === 'APPROVE' ? 'اعتماد تاجر' : 'رفض توثيق تاجر'}: ${verification.dealerName}${action === 'REJECT' && rejectReason ? ` (السبب: ${rejectReason})` : ''}`,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error('traders-approval POST error:', error);
    return errorResponse('فشل معالجة الطلب', 500);
  }
}
