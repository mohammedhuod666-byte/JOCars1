import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitAsync } from '@/lib/rate-limit';
import { sanitizePlainText } from '@/lib/sanitize';
import { sendWhatsApp } from '@/lib/whatsapp';
import prisma from '@/lib/prisma';
import { hashPassword, passwordVersion, signPasswordResetToken, verifyPasswordResetToken } from '@/lib/auth';

/**
 * POST /api/auth/forgot-password
 * Send a reset code via WhatsApp to the user's phone
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = await checkRateLimitAsync(`forgot-password:${ip}`, { windowMs: 60 * 1000, maxRequests: 3 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'تم تجاوز الحد المسموح. حاول بعد دقيقة.' }, { status: 429 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, password: true, whatsapp: true, isActive: true },
    });

    if (!user || !user.isActive) {
      // Security: don't reveal whether the email exists
      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد مسجلاً لدينا، سيتم إرسال رمز إعادة التعيين عبر الواتساب.',
      });
    }

    // Reset links are short-lived, signed, and invalidated when the password changes.
    let sentVia = 'none';
    if (user.whatsapp) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
      if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is required for password reset links');
      const token = signPasswordResetToken(user);
      const resetUrl = `${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
      const message = `🔒 *إعادة تعيين كلمة المرور في JO Cars*\\n\\nافتح الرابط التالي لإنشاء كلمة مرور جديدة. الرابط صالح لمدة 15 دقيقة:\\n${resetUrl}\\n\\nلا تشارك الرابط مع أي شخص.`;
      const result = await sendWhatsApp(user.whatsapp, message);
      if (result.success) {
        sentVia = 'whatsapp';
      }
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
 * Verify the signed reset link token (issued by POST above) and update password.
 * The token is short-lived (15m) and bound to the current password hash,
 * so it is automatically invalidated after the password changes — no
 * server-side store, no log output, works across restarts and instances.
 */
export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = await checkRateLimitAsync(`reset-password:${ip}`, { windowMs: 60 * 1000, maxRequests: 5 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'تم تجاوز الحد المسموح. حاول بعد دقيقة.' }, { status: 429 });
    }

    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string' || !newPassword) {
      return NextResponse.json({ success: false, error: 'البيانات المطلوبة غير كاملة' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ success: false, error: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' }, { status: 400 });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json({
        success: false,
        error: 'كلمة المرور يجب أن تحتوي على حرف كبير وأحرف صغيرة ورقم ورمز خاص (!@#$%^&*)',
      }, { status: 400 });
    }

    const verified = verifyPasswordResetToken(token);
    if (!verified) {
      return NextResponse.json({ success: false, error: 'رابط إعادة التعيين غير صالح أو منتهي. يرجى طلب رابط جديد.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      select: { id: true, password: true, isActive: true },
    });

    // Generic message: don't reveal whether the account exists.
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'رابط إعادة التعيين غير صالح أو منتهي. يرجى طلب رابط جديد.' }, { status: 400 });
    }

    // Token is bound to the password hash at issue time: reuse after a
    // successful reset (or any password change) is rejected here.
    if (passwordVersion(user.password) !== verified.passwordVersion) {
      return NextResponse.json({ success: false, error: 'تم استخدام هذا الرابط مسبقاً. يرجى طلب رابط جديد.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        // Reset failed login attempts on successful password reset
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
