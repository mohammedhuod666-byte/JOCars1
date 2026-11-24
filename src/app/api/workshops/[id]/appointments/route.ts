import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');

    const isOwner = workshop.userId === user.id;

    const where: any = { workshopId: id };
    if (!isOwner) {
      where.userId = user.id;
    }

    const [appointments, total] = await Promise.all([
      prisma.workshopAppointment.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, image: true, phone: true },
          },
          workshop: {
            select: { id: true, name: true, userId: true },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workshopAppointment.count({ where }),
    ]);

    return successResponse({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Appointments fetch error:', error);
    return errorResponse('فشل تحميل المواعيد', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const { date, time, serviceType, carMake, carModel, description,
      carYear, plateNumber, budget, isUrgent } = body;

    if (!date || !time || !serviceType) {
      return errorResponse('التاريخ والوقت ونوع الخدمة مطلوبة');
    }

    const workshop = await prisma.workshop.findUnique({ where: { id } });
    if (!workshop) return notFoundResponse('الورشة');
    if (workshop.isPaused || workshop.isBanned) {
      return errorResponse('الورشة غير متاحة حالياً');
    }

    // HTTP adapter لا يدعم المعاملات — ننفّذ بالتتابع: إنشاء الموعد، ثم العدّاد،
    // ثم رسالة الإشعار (التي كانت أيضًا غير قاتلة داخل المعاملة). لو فشل
    // العدّاد نحذف الموعد تعويضًا كما كان roll-back يفعل.
    let appointmentId: string | null = null;
    let appointment: any;
    try {
      appointment = await prisma.workshopAppointment.create({
        data: {
          workshopId: id,
          userId: user.id,
          date: new Date(date),
          time,
          serviceType,
          carMake: carMake || null,
          carModel: carModel || null,
          description: description || null,
          carYear: Number.isFinite(Number(carYear)) ? Number(carYear) : null,
          plateNumber: typeof plateNumber === 'string' ? plateNumber.trim().slice(0, 30) || null : null,
          budget: Number.isFinite(Number(budget)) ? Number(budget) : null,
          isUrgent: Boolean(isUrgent),
        },
      });
      appointmentId = appointment.id;

      await prisma.workshop.update({
        where: { id },
        data: { appointmentCount: { increment: 1 } },
      });
    } catch (createErr) {
      if (appointmentId) {
        await prisma.workshopAppointment.delete({ where: { id: appointmentId } }).catch(() => {});
      }
      throw createErr;
    }

    // Send notification message to workshop owner safely
    try {
      const bookingDate = new Date(date).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' });
      const notificationContent = ` موعد جديد: ${user.name} حجز موعداً في ${bookingDate} الساعة ${time}\nالخدمة: ${serviceType}${carMake ? `\nالسيارة: ${carMake} ${carModel || ''}${carYear ? ` (${carYear})` : ''}${plateNumber ? ` [${plateNumber}]` : ''}` : ''}${isUrgent ? `\n حجز طارئ` : ''}${budget ? `\nالميزانية المقدرة: ${budget} د.أ` : ''}${description ? `\nملاحظات: ${description}` : ''}`;

      let conv = await prisma.conversation.findFirst({
        where: {
          OR: [
            { buyerId: user.id, sellerId: workshop.userId },
            { buyerId: workshop.userId, sellerId: user.id }
          ]
        },
      });

      if (!conv) {
        const sellerCar = await prisma.car.findFirst({ where: { userId: workshop.userId }, select: { id: true } });
        if (sellerCar) {
          conv = await prisma.conversation.create({
            data: {
              carId: sellerCar.id,
              buyerId: user.id,
              sellerId: workshop.userId,
            },
          });
        }
      }

      await prisma.message.create({
        data: {
          content: notificationContent,
          senderId: user.id,
          receiverId: workshop.userId,
          conversationId: conv ? conv.id : null,
        },
      });
    } catch (msgErr) {
      console.warn('Notification message creation warning:', msgErr);
    }

    return successResponse(appointment, 201);
  } catch (error) {
    console.error('Appointment creation error:', error);
    return errorResponse('فشل إنشاء الموعد', 500);
  }
}
