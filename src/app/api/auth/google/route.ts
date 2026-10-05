import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { checkRateLimitAsync, getClientIp } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit';
import { randomBytes } from 'crypto';

interface GoogleTokenInfo {
  aud?: string;
  iss?: string;
  sub?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  exp?: string;
}

function getGoogleClientId(): string | null {
  const id = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return id && id !== 'your-google-client-id' ? id : null;
}

// POST /api/auth/google { idToken } → verify with Google, login or register
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(`google-login:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 10 });
    if (!rateLimit.allowed) {
      return errorResponse('محاولات كثيرة — حاول بعد 15 دقيقة', 429);
    }

    const clientId = getGoogleClientId();
    if (!clientId) {
      return errorResponse('تسجيل الدخول عبر Google غير مفعل — تواصل مع الإدارة', 503);
    }

    const body = await request.json().catch(() => null);
    const idToken = typeof body?.idToken === 'string' ? body.idToken : '';
    if (!idToken || idToken.length > 5000) {
      return errorResponse('رمز Google مطلوب', 400);
    }

    // Verify the ID token directly with Google (no extra dependency)
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!verifyRes.ok) {
      return errorResponse('رمز Google غير صالح', 401);
    }
    const info = (await verifyRes.json()) as GoogleTokenInfo;

    if (info.aud !== clientId) {
      return errorResponse('رمز Google غير صالح لهذا الموقع', 401);
    }
    if (info.iss !== 'accounts.google.com' && info.iss !== 'https://accounts.google.com') {
      return errorResponse('رمز Google غير صالح', 401);
    }
    if (info.email_verified !== 'true' || !info.email) {
      return errorResponse('بريد Google غير موثق', 401);
    }
    if (info.exp && Number(info.exp) * 1000 < Date.now()) {
      return errorResponse('انتهت صلاحية رمز Google — حاول مجددا', 401);
    }

    const email = info.email.trim().toLowerCase();
    const name = (info.name || email.split('@')[0]).slice(0, 100);
    const picture = typeof info.picture === 'string' ? info.picture.slice(0, 2000) : null;

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!user.isActive) return errorResponse('الحساب موقوف — تواصل مع الإدارة', 403);
      const lockedUntil = (user as { lockedUntil?: Date | null }).lockedUntil;
      if (lockedUntil && new Date(lockedUntil) > new Date()) {
        return errorResponse('الحساب مقفل مؤقتاً', 403);
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          image: user.image || picture,
          lastLoginAt: new Date(),
          lastLoginIp: ip,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    } else {
      // New Google user — create with an unusable random password (login via Google only)
      const randomPassword = randomBytes(32).toString('hex');
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: await hashPassword(randomPassword),
          image: picture,
          role: 'USER',
          emailVerified: true,
          lastLoginAt: new Date(),
          lastLoginIp: ip,
        },
      });
    }

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
    await createAuditLog({
      action: 'LOGIN', actorId: user.id,
      entityType: 'USER', entityId: user.id,
      description: `تسجيل دخول عبر Google: ${user.name}`,
      ip: ip !== 'unknown' ? ip : undefined,
    }).catch(() => {});
    return response;
  } catch (error) {
    console.error('Google login error:', error);
    return errorResponse('حدث خطأ', 500);
  }
}
