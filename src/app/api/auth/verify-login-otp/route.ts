import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken, setAuthCookie } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOtp, deleteOtp, MAX_OTP_ATTEMPTS, normalizeJoPhone } from '@/lib/otp-store';
import { createAuditLog } from '@/lib/audit';

// POST /api/auth/verify-login-otp { phone, code } → login without password
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';

    const rateLimit = checkRateLimit(`verify-login-otp:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 10 });
    if (!rateLimit.allowed) {
      return errorResponse('محاولات كثيرة — حاول بعد 15 دقيقة', 429);
    }

    const body = await request.json();
    const phone = normalizeJoPhone(body.phone || '');
    const code = String(body.code || '').trim();
    if (!phone || !code) return errorResponse('الرقم والرمز مطلوبان', 400);

    const record = getOtp(phone);
    if (!record) return errorResponse('لا يوجد رمز صالح — اطلب رمزاً جديداً', 400);
    if (Date.now() > record.expiresAt) {
      deleteOtp(phone);
      return errorResponse('انتهت صلاحية الرمز — اطلب رمزاً جديداً', 400);
    }
    if (record.code !== code) {
      record.attempts++;
      if (record.attempts >= MAX_OTP_ATTEMPTS) {
        deleteOtp(phone);
        return errorResponse('تجاوزت المحاولات — اطلب رمزاً جديداً', 400);
      }
      return errorResponse('الرمز غير صحيح', 400);
    }
    deleteOtp(phone);

    const user = await prisma.user.findFirst({
      where: { OR: [{ phone }, { phone: phone.replace('+', '') }, { whatsapp: phone }] },
    });
    if (!user) return errorResponse('الحساب غير موجود', 404);
    if (!user.isActive) return errorResponse('الحساب موقوف', 403);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip, failedLoginAttempts: 0, lockedUntil: null, phoneVerified: true },
    });

    await createAuditLog({
      action: 'LOGIN', actorId: user.id,
      entityType: 'USER', entityId: user.id,
      description: `تسجيل دخول برمز OTP: ${user.name}`,
      ip: ip !== 'unknown' ? ip : undefined,
    }).catch(() => {});

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const response = successResponse({
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        image: user.image, phone: user.phone, whatsapp: user.whatsapp,
        whatsappNotifications: user.whatsappNotifications, dealerName: user.dealerName,
      },
      token,
    });
    setAuthCookie(response, token);
    return response;
  } catch {
    return errorResponse('حدث خطأ', 500);
  }
}
