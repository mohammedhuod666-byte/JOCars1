import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { checkRateLimitAsync, getClientIp } from '@/lib/rate-limit';
import { setOtp, normalizeJoPhone, generateSecureOtp } from '@/lib/otp-store';
import { getOtp, deleteOtp } from '@/lib/otp-store';
import { sendWhatsApp } from '@/lib/whatsapp';

// Backwards compatibility: older code imported otpStore from here.
// Now proxies to the single shared store in src/lib/otp-store.ts.
export const otpStore = { get: getOtp, set: setOtp, delete: deleteOtp };

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const ip = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(`otp:${ip}`, { windowMs: 60 * 1000, maxRequests: 3 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'تم تجاوز حد طلبات الرموز. حاول بعد دقيقة' }, { status: 429 });
    }

    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'رقم الهاتف مطلوب' }, { status: 400 });
    }

    const formattedPhone = normalizeJoPhone(phone);
    if (!formattedPhone) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال رقم هاتف أردني صحيح (+962 7X XXXXXXX)' }, { status: 400 });
    }

    const code = generateSecureOtp();

    setOtp(formattedPhone, code);

    const message = ` *رمز التحقق الخاص بك في منصة JO Cars*\n\nالرمز: *${code}*\n\nينتهي خلال 5 دقائق. لا تشارك هذا الرمز مع أي شخص.`;
    await sendWhatsApp(formattedPhone, message);

    // Never log the OTP code itself — server logs must not contain secrets
    console.log(`[OTP] Sent OTP to ${formattedPhone}`);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق بنجاح إلى رقم الهاتف',
      phone: formattedPhone,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json({ success: false, error: 'فشل إرسال رمز التحقق' }, { status: 500 });
  }
}
