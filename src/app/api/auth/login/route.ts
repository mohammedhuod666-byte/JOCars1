import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, signToken, setAuthCookie, detectBcryptCost, hashPassword, TARGET_BCRYPT_COST } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api';
import { checkRateLimitAsync, RATE_LIMITS, resetRateLimit } from '@/lib/security/rate-limit';
import { isIPBlocked, blockIP, trackSuspiciousActivity } from '@/lib/security/ip-blacklist';
import { createAuditLog } from '@/lib/audit';
import { recordSignal } from '@/lib/security/sentinel';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || request.headers.get('cf-connecting-ip')
      || 'unknown';

    if (isIPBlocked(ip)) {
      return errorResponse('تم حظر عنوان IP الخاص بك مؤقتاً', 403);
    }

    const rateLimitKey = `login:${ip}`;
    const rateLimit = await checkRateLimitAsync(rateLimitKey, RATE_LIMITS.LOGIN);
    if (!rateLimit.allowed) {
      if (trackSuspiciousActivity(ip)) {
        blockIP(ip, 'Excessive login attempts');
      }
      return errorResponse('تم تجاوز الحد المسموح', 429);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return errorResponse('بيانات غير صالحة', 400);
    const validation = loginSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { email: identifier, password } = validation.data;

    // Email OR Jordanian phone login (الأردني يدخل برقمه غالباً)
    let user = null;
    const idTrimmed = identifier.trim();
    if (idTrimmed.includes('@')) {
      user = await prisma.user.findUnique({ where: { email: idTrimmed } });
    } else {
      const digits = idTrimmed.replace(/[^0-9+]/g, '');
      let variants = [digits];
      if (/^07[789]\d{7}$/.test(digits)) variants = [digits, '+962' + digits.slice(1), '962' + digits.slice(1)];
      else if (/^9627[789]\d{7}$/.test(digits)) variants = [digits, '+' + digits, '0' + digits.slice(3)];
      else if (/^\+9627[789]\d{7}$/.test(digits)) variants = [digits, digits.slice(1), '0' + digits.slice(4)];
      user = await prisma.user.findFirst({
        where: { OR: [{ phone: { in: variants } }, { whatsapp: { in: variants } }] },
      });
    }
    if (!user) return errorResponse('بيانات الدخول غير صحيحة');

    if (!user.isActive) return errorResponse('الحساب موقوف', 403);

    const lockedUntil = (user as any).lockedUntil;
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      return errorResponse('الحساب مقفل مؤقتاً', 403);
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      const failedAttempts = ((user as any).failedLoginAttempts || 0) + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };

      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.failedLoginAttempts = 0;
        blockIP(ip, 'Account locked after 5 failed attempts', 30 * 60 * 1000);
      }

      await prisma.user.update({ where: { id: user.id }, data: updateData });
      // Sentinel: brute-force signal at 5 and 10 consecutive failures.
      if (failedAttempts === 5 || failedAttempts === 10) {
        recordSignal({
          userId: user.id, ip,
          type: 'BRUTE_FORCE',
          weight: failedAttempts === 10 ? 25 : 15,
          detail: `${failedAttempts} محاولات دخول فاشلة متتالية`,
        }).catch(() => {});
      }
      return errorResponse('بيانات الدخول غير صحيحة');
    }

    resetRateLimit(rateLimitKey);

    // Lazy, on-login migration of legacy bcrypt costs. Only reached after
    // `verifyPassword` succeeded, so an invalid guess can never trigger a write. If
    // the rehash/update fails, the login still succeeds: the user is authenticated,
    // the old hash remains fully valid, and the next login simply retries the
    // upgrade. Never blocks access, never stores plaintext, never logs the hash.
    const currentCost = detectBcryptCost(user.password);
    if (currentCost !== null && currentCost > TARGET_BCRYPT_COST) {
      try {
        const upgraded = await hashPassword(password);
        await prisma.user.update({ where: { id: user.id }, data: { password: upgraded } });
      } catch (rehashError) {
        console.error(JSON.stringify({
          level: 'ERROR', action: 'PASSWORD_REHASH_FAILED', userId: user.id,
          message: 'lazy bcrypt upgrade after successful login failed; old hash retained',
        }));
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        lastSeenAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

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
      description: `تسجيل دخول: ${user.name}`,
      ip: ip !== 'unknown' ? ip : undefined,
    });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('حدث خطأ', 500);
  }
}
