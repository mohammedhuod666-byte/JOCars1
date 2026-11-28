import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitAsync } from '@/lib/security/rate-limit';
import { sanitizePlainText } from '@/lib/security/sanitize';
import { sendWhatsApp } from '@/lib/whatsapp';
import { notifyAdmins } from '@/lib/admin-notify';
import { createAuditLog } from '@/lib/audit';
import prisma from '@/lib/prisma';
import { hashPassword, passwordVersion, signPasswordResetToken, verifyPasswordResetToken } from '@/lib/auth';
import {
  generateRecoveryKey,
  hashRecoveryKeyArgon2id,
  verifyRecoveryKeyArgon2id,
} from '@/lib/security/recovery-key';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

async function findUserByIdentifier(identifier: string) {
  const clean = identifier.trim();
  if (clean.includes('@')) {
    return prisma.user.findUnique({
      where: { email: clean.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
        passwordVersion: true,
        recoveryKeyHash: true,
        whatsapp: true,
        isActive: true,
      },
    });
  }
  const digits = clean.replace(/\D/g, '');
  const variants = Array.from(
    new Set([
      clean,
      digits,
      digits.startsWith('07') ? '962' + digits.slice(1) : digits,
      digits.startsWith('962') ? '0' + digits.slice(3) : digits,
    ])
  ).filter(Boolean);

  return prisma.user.findFirst({
    where: { OR: [{ phone: { in: variants } }, { whatsapp: { in: variants } }] },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      password: true,
      passwordVersion: true,
      recoveryKeyHash: true,
      whatsapp: true,
      isActive: true,
    },
  });
}

/**
 * POST /api/auth/forgot-password
 * Supports:
 * 1) mode: 'recovery-key' — instant in-app reset verified with one-way Argon2id Recovery Key (rotates key & invalidates old sessions)
 * 2) mode: 'legacy-request' — for old accounts that have not generated a Recovery Key yet (notifies admin)
 * 3) default WhatsApp token fallback
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const body = await request.json();
    const mode = typeof body.mode === 'string' ? body.mode : '';

    // ── Mode 1: Instant Argon2id Recovery Key Reset ──
    if (mode === 'recovery-key') {
      const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
      const recoveryKey = typeof body.recoveryKey === 'string' ? body.recoveryKey.trim() : '';
      const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

      // Strict rate limit: 3 attempts per 15 minutes per IP and per identifier
      const ipLimit = await checkRateLimitAsync(`recovery-ip:${ip}`, {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
      });
      if (!ipLimit.allowed) {
        return NextResponse.json(
          { success: false, error: 'تم تجاوز الحد المسموح للمحاولات. يرجى الانتظار 15 دقيقة.' },
          { status: 429 }
        );
      }
      if (identifier) {
        const idLimit = await checkRateLimitAsync(`recovery-id:${identifier.toLowerCase()}`, {
          windowMs: 15 * 60 * 1000,
          maxRequests: 3,
        });
        if (!idLimit.allowed) {
          return NextResponse.json(
            { success: false, error: 'تم قفل المحاولات مؤقتاً لهذا الحساب لمدة 15 دقيقة لحمايتك.' },
            { status: 429 }
          );
        }
      }

      if (!identifier || !recoveryKey || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'يرجى تعبئة البريد/الهاتف ومفتاح الاسترداد وكلمة المرور الجديدة' },
          { status: 400 }
        );
      }

      if (!PASSWORD_REGEX.test(newPassword)) {
        return NextResponse.json(
          {
            success: false,
            error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير وصغير ورقم ورمز خاص (!@#$%)',
          },
          { status: 400 }
        );
      }

      const user = await findUserByIdentifier(identifier);
      // Unified error message to prevent user enumeration
      if (!user || !user.isActive || !user.recoveryKeyHash) {
        return NextResponse.json(
          { success: false, error: 'البيانات المدخلة غير صحيحة أو لم يتم تفعيل مفتاح استرداد لهذا الحساب' },
          { status: 401 }
        );
      }

      const valid = verifyRecoveryKeyArgon2id(recoveryKey, user.recoveryKeyHash);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: 'البيانات المدخلة غير صحيحة أو لم يتم تفعيل مفتاح استرداد لهذا الحساب' },
          { status: 401 }
        );
      }

      // Valid! Rotate password, bump passwordVersion (logs out other devices), and rotate to a fresh one-time Recovery Key
      const hashedPassword = await hashPassword(newPassword);
      const nextVer = String((parseInt(user.passwordVersion || '1', 10) || 1) + 1);
      const nextRecoveryKey = generateRecoveryKey();
      const nextRecoveryHash = hashRecoveryKeyArgon2id(nextRecoveryKey);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordVersion: nextVer,
          recoveryKeyHash: nextRecoveryHash,
          recoveryKeyCreatedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      await createAuditLog({
        action: 'PASSWORD_RESET_RECOVERY_KEY',
        actorId: user.id,
        entityType: 'USER',
        entityId: user.id,
        description: 'إعادة تعيين كلمة المرور بمفتاح الاسترداد السري (Argon2id) وتجديد المفتاح',
        ip: ip !== 'unknown' ? ip : undefined,
      }).catch(() => {});

      await prisma.notification
        .create({
          data: {
            type: 'SECURITY',
            title: 'تنبيه أمني: تم تغيير كلمة المرور',
            message: 'تمت إعادة تعيين كلمة مرور حسابك باستخدام مفتاح الاسترداد السري وتوليد مفتاح جديد.',
            userId: user.id,
            link: '/auth/profile',
          },
        })
        .catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح وتوليد مفتاح استرداد جديد.',
        newRecoveryKey: nextRecoveryKey,
      });
    }

    // ── Mode 2: Old Account Fallback (no recovery key generated yet) ──
    if (mode === 'legacy-request') {
      const rateLimit = await checkRateLimitAsync(`legacy-reset:${ip}`, {
        windowMs: 15 * 60 * 1000,
        maxRequests: 3,
      });
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { success: false, error: 'تم تجاوز الحد المسموح. يرجى الانتظار 15 دقيقة.' },
          { status: 429 }
        );
      }

      const identifier = sanitizePlainText(String(body.identifier || '')).slice(0, 120);
      const contactPhone = sanitizePlainText(String(body.contactPhone || '')).slice(0, 30);
      if (!identifier) {
        return NextResponse.json(
          { success: false, error: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف المسجل' },
          { status: 400 }
        );
      }

      const user = await findUserByIdentifier(identifier);
      if (user && user.isActive) {
        notifyAdmins(
          'PASSWORD_RESET_REQUEST',
          'طلب استعادة حساب قديم',
          `المستخدم ${user.name} (${user.email}) طلب استعادة كلمة المرور (لا يملك مفتاح استرداد). رقم التواصل: ${contactPhone || user.phone || 'غير متوفر'}`,
          `/admin/users?search=${encodeURIComponent(user.email)}`
        );
      }

      return NextResponse.json({
        success: true,
        message:
          'تم استلام طلبك بنجاح. إذا كان الحساب مسجلاً لدينا، ستتواصل معك الإدارة لتزويدك برابط استعادة مؤقت.',
      });
    }

    // ── Mode 3: Legacy WhatsApp Reset Link ──
    const rateLimit = await checkRateLimitAsync(`forgot-password:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 3,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز الحد المسموح. حاول بعد دقيقة.' },
        { status: 429 }
      );
    }

    const { email } = body;
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, password: true, whatsapp: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد مسجلاً لدينا، سيتم إرسال رمز إعادة التعيين عبر الواتساب.',
      });
    }

    let sentVia = 'none';
    if (user.whatsapp) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
      if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is required for password reset links');
      const token = signPasswordResetToken(user);
      const resetUrl = `${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
      const message = ` *إعادة تعيين كلمة المرور في JO Cars*\n\nافتح الرابط التالي لإنشاء كلمة مرور جديدة. الرابط صالح لمدة 15 دقيقة:\n${resetUrl}\n\nلا تشارك الرابط مع أي شخص.`;
      const result = await sendWhatsApp(user.whatsapp, message);
      if (result.success) sentVia = 'whatsapp';
    }

    return NextResponse.json({
      success: true,
      message: 'إذا كان البريد مسجلاً لدينا، سيتم إرسال رمز إعادة التعيين عبر الواتساب.',
      sentVia,
    });
  } catch (error) {
    console.error('[Forgot Password] Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 });
  }
}

/**
 * PUT /api/auth/forgot-password
 * Verify the signed reset link token and update password.
 */
export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = await checkRateLimitAsync(`reset-password:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 5,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز الحد المسموح. حاول بعد دقيقة.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string' || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'البيانات المطلوبة غير كاملة' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || !PASSWORD_REGEX.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          error: 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل وحرف كبير وصغير ورقم ورمز خاص (!@#$%^&*)',
        },
        { status: 400 }
      );
    }

    const verified = verifyPasswordResetToken(token);
    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'رابط إعادة التعيين غير صالح أو منتهي. يرجى طلب رابط جديد.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      select: { id: true, password: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'رابط إعادة التعيين غير صالح أو منتهي. يرجى طلب رابط جديد.' },
        { status: 400 }
      );
    }

    if (passwordVersion(user.password) !== verified.passwordVersion) {
      return NextResponse.json(
        { success: false, error: 'تم استخدام هذا الرابط مسبقاً. يرجى طلب رابط جديد.' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
    });
  } catch (error) {
    console.error('[Reset Password] Error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 });
  }
}
