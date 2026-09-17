import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';

// GET /api/reminders → my active reminders
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const reminders = await prisma.carReminder.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { dueDate: 'asc' },
      take: 100,
    });
    return successResponse({ reminders });
  } catch {
    return errorResponse('فشل تحميل التذكيرات', 500);
  }
}

// POST /api/reminders { type, title, dueDate, carId?, plateNumber?, notifyBefore? } → e.g. license renewal
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const rateLimit = checkRateLimit(`reminders:${user.id}`, { windowMs: 60 * 1000, maxRequests: 20 });
  if (!rateLimit.allowed) return errorResponse('محاولات كثيرة — حاول بعد دقيقة', 429);

  try {
    const body = await request.json();
    const { type, title, description, dueDate, carId, plateNumber, notifyBefore } = body;

    if (!type || !title || !dueDate) return errorResponse('النوع والعنوان والتاريخ مطلوبة', 400);
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return errorResponse('تاريخ غير صالح', 400);

    if (carId) {
      const car = await prisma.car.findUnique({ where: { id: carId }, select: { userId: true } });
      if (!car) return errorResponse('السيارة غير موجودة', 404);
    }

    const reminder = await prisma.carReminder.create({
      data: {
        userId: user.id,
        type: String(type).slice(0, 50),
        title: String(title).slice(0, 200),
        description: typeof description === 'string' ? description.slice(0, 1000) : null,
        dueDate: due,
        carId: carId || null,
        plateNumber: plateNumber || null,
        notifyBefore: Math.min(90, Math.max(0, parseInt(notifyBefore) || 7)),
        phone: user.phone || '',
        whatsapp: user.whatsapp,
      },
    });

    return successResponse(reminder, 201);
  } catch {
    return errorResponse('فشل إنشاء التذكير', 500);
  }
}
