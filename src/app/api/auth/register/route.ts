import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { generateRecoveryKey, hashRecoveryKeyArgon2id } from '@/lib/recovery-key';
import { registerSchema } from '@/lib/validations';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api';
import { notifyAdmins, getAdminNotifyLink } from '@/lib/admin-notify';
import { checkRateLimitAsync, RATE_LIMITS } from '@/lib/rate-limit';
import { isIPBlocked, blockIP, trackSuspiciousActivity } from '@/lib/ip-blacklist';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || request.headers.get('cf-connecting-ip')
      || 'unknown';

    if (isIPBlocked(ip)) {
      return errorResponse('تم حظر عنوان IP الخاص بك مؤقتاً', 403);
    }

    const rateLimitKey = `register:${ip}`;
    const rateLimit = await checkRateLimitAsync(rateLimitKey, RATE_LIMITS.REGISTER);
    if (!rateLimit.allowed) {
      if (trackSuspiciousActivity(ip)) {
        blockIP(ip, 'Excessive registration attempts');
      }
      return errorResponse('تم تجاوز الحد المسموح', 429);
    }

    const body = await request.json();

    // Honeypot check
    if (body.website || body.honeypot) {
      return successResponse({ message: 'تم التسجيل بنجاح' }, 201);
    }

    const validation = registerSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const {
      name, email, password, phone, role,
      dealerName, dealerDescription, dealerAddress, dealerLogo, commercialReg,
    } = validation.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse('البريد الإلكتروني مستخدم بالفعل');

    const isTrader = role === 'TRADER';
    // حساب التاجر يُسجّل دخوله مباشرةً مع role='TRADER' و dealerVerified=false
    // (الافتراضي). لم نعد نضع طلب اعتماد معلّق (TraderVerification PENDING):
    // المستخدم طلب صراحةً أن يتم التسجيل "بشكل طبيعي عادي بدون موافقه".
    // إن أرادت الإدارة تفعيل dealerVerified لاحقًا تتم عبر صفحة /admin/users
    // (تُرقّي المستخدم وتضبط dealerVerified=true) أو تبقى تجارة معلّقة.
    const finalRole = isTrader ? 'TRADER' : (role || 'USER');

    const hashedPassword = await hashPassword(password);
    const plainRecoveryKey = generateRecoveryKey();
    const recoveryKeyHash = hashRecoveryKeyArgon2id(plainRecoveryKey);

    // HTTP adapter لا يدعم المعاملات ($transaction يرمي خطأ في وضع HTTP) —
    // العملية هنا إنشاء صف واحد فقط، لذا ننشئه مباشرةً بدون تغليف.
    const result = await prisma.user.create({
      data: {
        name, email, password: hashedPassword, phone,
        recoveryKeyHash, recoveryKeyCreatedAt: new Date(),
        role: finalRole, dealerName, lastLoginAt: new Date(), lastLoginIp: ip,
        // حفظ حقول ملف التاجر فورًا كي يُعرَض الاسم في صفحة الإدارة
        // (dealerVerified يبقى false — يحتاج اعتمادًا اختياريًا).
        ...(isTrader ? {
          dealerDescription, dealerAddress, dealerLogo,
          dealerCommercialReg: commercialReg,
        } : {}),
      },
      select: {
        id: true, name: true, email: true, role: true, image: true,
        phone: true, whatsapp: true, whatsappNotifications: true,
        dealerName: true, dealerVerified: true,
      },
    });

    // لم نعد ننشئ صف TraderVerification PENDING هنا — راجع التعليق أعلاه.

    notifyAdmins(
      isTrader ? 'NEW_TRADER' : 'NEW_USER',
      isTrader ? 'تاجر جديد سجّل' : 'مستخدم جديد',
      isTrader
        ? `تاجر جديد سجّل بنفسه: ${result.name} (${result.email}) — يحتاج اعتماد الإدارة لتفعيل استقبال الحجوزات`
        : `مستخدم جديد سجل: ${result.name} (${result.email})`,
      getAdminNotifyLink(isTrader ? 'NEW_TRADER' : 'NEW_USER'),
    );

    const token = signToken({ userId: result.id, email: result.email, role: result.role });
    const response = successResponse({ user: result, token, recoveryKey: plainRecoveryKey }, 201);
    setAuthCookie(response, token);
    await createAuditLog({
      action: 'REGISTER', actorId: result.id,
      entityType: 'USER', entityId: result.id,
      description: `حساب جديد (${result.role}): ${result.name}`,
      ip: ip !== 'unknown' ? ip : undefined,
    });
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('حدث خطأ', 500);
  }
}
