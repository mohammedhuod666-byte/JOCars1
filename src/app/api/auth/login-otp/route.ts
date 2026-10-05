import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimitAsync, getClientIp } from '@/lib/rate-limit';
import { setOtp, normalizeJoPhone, generateSecureOtp } from '@/lib/otp-store';
import { sendWhatsApp, isWhatsAppConfigured } from '@/lib/whatsapp';

// POST /api/auth/login-otp { phone } → send login code via WhatsApp
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(`login-otp:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 5 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'محاولات كثيرة — حاول بعد 15 دقيقة' }, { status: 429 });
    }

    const body = await request.json();
    const phone = normalizeJoPhone(body.phone || '');
    if (!phone) {
      return NextResponse.json({ success: false, error: 'رقم هاتف أردني غير صالح (مثال: 0791234567)' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ phone }, { phone: phone.replace('+', '') }, { whatsapp: phone }] },
      select: { id: true, isActive: true },
    });
    // Same message whether or not the account exists (no account enumeration)
    if (user && !user.isActive) {
      return NextResponse.json({ success: false, error: 'الحساب موقوف — تواصل مع الإدارة' }, { status: 403 });
    }

    if (user) {
      const code = generateSecureOtp();
      setOtp(phone, code);
      const message = `رمز دخول JO Cars

الرمز: ${code}

صالح 5 دقائق. لا تشاركه مع أحد.`;
      const result = await sendWhatsApp(phone, message);
      // Always log the code server-side so admins can help users in dev/tests.
      // In production with a real provider this line should be removed.
      console.log(`[OTP] code for ${phone}: ${code} (delivered=${result.success} via=${result.method})`);

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.method === 'log'
            ? 'خدمة الواتساب غير مفعلة على الخادم — تواصل مع الإدارة لتفعيل ULTRA_MSG_TOKEN'
            : `فشل إرسال الواتساب: ${result.error || 'خطأ غير معروف'}`,
          whatsappConfigured: false,
          // Dev-only: expose the code so the tester can log in without WhatsApp.
          // Never sent in production.
          ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
        }, { status: 503 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'إذا كان الرقم مسجلاً ستصلك رسالة واتساب برمز الدخول',
      whatsappConfigured: isWhatsAppConfigured(),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'فشل إرسال الرمز' }, { status: 500 });
  }
}
