import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { setOtp, normalizeJoPhone } from '@/lib/otp-store';
import { sendWhatsApp, isWhatsAppConfigured } from '@/lib/whatsapp';

// POST /api/auth/login-otp { phone } → send login code via WhatsApp
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`login-otp:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 5 });
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
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setOtp(phone, code);
      await sendWhatsApp(phone, `🔑 *رمز دخول JO Cars*\n\nالرمز: *${code}*\n\nصالح 5 دقائق. لا تشاركه مع أحد.`);
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
