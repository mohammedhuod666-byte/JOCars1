import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { notifyAdmins, getAdminNotifyLink } from '@/lib/admin-notify';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit';

// GET /api/trader/verification → my latest verification request (if any)
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dealerVerified: true },
    });
    const latest = await prisma.traderVerification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, rejectReason: true, createdAt: true, reviewedAt: true },
    });
    return successResponse({ request: latest, dealerVerified: full?.dealerVerified ?? false });
  } catch {
    return errorResponse('فشل تحميل حالة التوثيق', 500);
  }
}

// POST /api/trader/verification → submit a verification request (from dealer dashboard)
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  if (user.role !== 'TRADER' && user.role !== 'DEALER' && user.role !== 'ADMIN') {
    return errorResponse('طلب التوثيق متاح لحسابات التجار فقط', 403);
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      dealerVerified: true, dealerName: true, name: true, email: true,
      dealerLogo: true, dealerDescription: true, dealerAddress: true,
      dealerCommercialReg: true,
    },
  });

  if (profile?.dealerVerified) {
    return errorResponse('حسابك موثّق مسبقاً ', 400);
  }

  const rateLimit = checkRateLimit(`verify-req:${user.id}`, { windowMs: 60 * 60 * 1000, maxRequests: 3 });
  if (!rateLimit.allowed) return errorResponse('لقد أرسلت عدة طلبات — حاول لاحقاً', 429);

  try {
    const existing = await prisma.traderVerification.findFirst({
      where: { userId: user.id, status: 'PENDING' },
      select: { id: true },
    });
    if (existing) {
      return errorResponse('لديك طلب توثيق معلّق قيد المراجعة ', 400);
    }

    const body = await request.json().catch(() => ({}));
    const notes = typeof body.notes === 'string' ? body.notes.slice(0, 1000) : null;

    const created = await prisma.traderVerification.create({
      data: {
        userId: user.id,
        status: 'PENDING',
        dealerName: profile?.dealerName || profile?.name || user.name,
        dealerLogo: profile?.dealerLogo,
        dealerDescription: profile?.dealerDescription,
        dealerAddress: profile?.dealerAddress,
        commercialReg: profile?.dealerCommercialReg,
        notes,
      },
      select: { id: true, status: true, createdAt: true },
    });

    notifyAdmins(
      'TRADER_VERIFICATION',
      'طلب توثيق تاجر جديد',
      `التاجر ${profile?.dealerName || user.name} (${user.email}) طلب توثيق حسابه — بانتظار المراجعة`,
      getAdminNotifyLink('TRADER_VERIFICATION', created.id),
    );

    await createAuditLog({
      action: 'TRADER_REQUEST', actorId: user.id,
      entityType: 'TRADER_VERIFICATION', entityId: created.id,
      description: `طلب توثيق تاجر: ${profile?.dealerName || user.name}`,
    });

    return successResponse({ request: created }, 201);
  } catch {
    return errorResponse('فشل إرسال طلب التوثيق', 500);
  }
}
