import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

// POST /api/push/subscribe { endpoint, p256dh, auth } → save browser subscription
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { endpoint, p256dh, auth } = body || {};
    if (!endpoint || !p256dh || !auth) return errorResponse('بيانات الاشتراك ناقصة', 400);

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: user.id, endpoint, p256dh, auth },
      update: { userId: user.id, p256dh, auth },
    });

    return successResponse({ subscribed: true });
  } catch {
    return errorResponse('فشل حفظ الاشتراك', 500);
  }
}

// DELETE /api/push/subscribe { endpoint } → remove browser subscription
export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json().catch(() => ({}));
    if (body.endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: body.endpoint, userId: user.id },
      });
    }
    return successResponse({ subscribed: false });
  } catch {
    return errorResponse('فشل إلغاء الاشتراك', 500);
  }
}
