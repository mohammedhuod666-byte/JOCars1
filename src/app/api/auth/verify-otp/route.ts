import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { checkRateLimitAsync, getClientIp } from '@/lib/security/rate-limit';
import { getOtp, deleteOtp, incrementOtpAttempts, normalizeJoPhone } from '@/lib/security/otp-store';

const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    // Brute-force protection: max 10 verify attempts per IP per minute
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(`verify-otp:${ip}`, { windowMs: 60 * 1000, maxRequests: 10 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'محاولات كثيرة. حاول بعد دقيقة' }, { status: 429 });
    }

    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'رقم الهاتف والرمز مطلوبان' }, { status: 400 });
    }

    const formattedPhone = normalizeJoPhone(String(phone));
    if (!formattedPhone) {
      return NextResponse.json({ success: false, error: 'رقم هاتف أردني غير صالح' }, { status: 400 });
    }

    const record = getOtp(formattedPhone);

    if (!record) {
      return NextResponse.json({ success: false, error: 'لم يتم العثور على رمز تحقق صالح لهذا الرقم' }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      deleteOtp(formattedPhone);
      return NextResponse.json({ success: false, error: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد' }, { status: 400 });
    }

    if (record.code !== String(code).trim()) {
      // Count wrong attempts — burn the code after too many guesses
      const attempts = incrementOtpAttempts(formattedPhone);
      if (attempts >= MAX_OTP_ATTEMPTS) {
        deleteOtp(formattedPhone);
        return NextResponse.json({ success: false, error: 'تجاوزت عدد المحاولات. اطلب رمزاً جديداً' }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: 'رمز التحقق غير صحيح' }, { status: 400 });
    }

    // Success! Update user phone & phoneVerified status in DB
    deleteOtp(formattedPhone);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: formattedPhone,
        whatsapp: formattedPhone,
        phoneVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم التوثيق بنجاح! تم ربط رقم الهاتف وتأكيده لحسابك',
    });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ success: false, error: 'فشل التحقق من الرمز' }, { status: 500 });
  }
}
