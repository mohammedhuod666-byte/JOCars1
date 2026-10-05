import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { reportSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { notifyAdmins, getAdminNotifyLink } from '@/lib/admin-notify';
import { sendWhatsAppToAdmins, buildAdminMessage } from '@/lib/whatsapp';
import { recordSignal } from '@/lib/sentinel';

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validation = reportSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const report = await prisma.report.create({
      data: {
        ...validation.data,
        userId: user.id,
        carId: body.carId,
      },
    });

    notifyAdmins('NEW_REPORT', 'بلاغ جديد', `تم تقديم بلاغ من ${user.name}: ${validation.data.reason}`, getAdminNotifyLink('NEW_REPORT'));
    sendWhatsAppToAdmins(buildAdminMessage('new_report', {
      reporterName: user.name, reason: validation.data.reason, carTitle: '',
    }));

    // Sentinel: count pending reports against this car's owner.
    // 3rd pending → signal (20), 5th → +40: crosses straight to temp ban.
    prisma.car.findUnique({ where: { id: body.carId }, select: { userId: true } }).then(async (owner) => {
      if (!owner || owner.userId === user.id) return;
      const pending = await prisma.report.count({ where: { carId: body.carId, status: 'PENDING' } });
      if (pending === 3 || pending === 5) {
        await recordSignal({
          userId: owner.userId, type: 'ABUSE_REPORTS',
          weight: pending >= 5 ? 40 : 20,
          detail: `${pending} بلاغات معلقة على إعلاناته`,
        });
      }
    }).catch(() => {});

    return successResponse(report, 201);
  } catch (error) {
    console.error('Report creation error:', error);
    return errorResponse('فشل إرسال البلاغ', 500);
  }
}
