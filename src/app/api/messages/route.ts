import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { messageSchema } from '@/lib/validations';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api';
import { sendWhatsApp, buildCarMessage } from '@/lib/whatsapp';
import { publishConversationEvent } from '@/lib/realtime';
import { notifyAdmins, getAdminNotifyLink } from '@/lib/admin-notify';

async function canAccessConversation(conversationId: string, userId: string, role: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true, sellerId: true },
  });

  if (!conversation) return 'NOT_FOUND';
  if (role === 'ADMIN') return 'ALLOWED';
  if (conversation.buyerId === userId || conversation.sellerId === userId) return 'ALLOWED';
  return 'FORBIDDEN';
}

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
      include: {
        sender: { select: { id: true, name: true, image: true, role: true } },
        receiver: { select: { id: true, name: true, image: true, role: true } },
        car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return successResponse(messages);
  } catch (error) {
    return errorResponse('فشل تحميل الرسائل', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validation = messageSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : null;
    if (conversationId) {
      const access = await canAccessConversation(conversationId, user.id, user.role);
      if (access === 'NOT_FOUND') return errorResponse('المحادثة غير موجودة', 404);
      if (access === 'FORBIDDEN') return errorResponse('لا تملك صلاحية الوصول إلى هذه المحادثة', 403);
    }

    const msgData: Record<string, unknown> = {
      content: validation.data.content,
      senderId: user.id,
      receiverId: validation.data.receiverId,
      carId: validation.data.carId,
    };

    if (conversationId) {
      msgData.conversationId = conversationId;
    }

    const message = await prisma.message.create({
      data: msgData as {
        content: string;
        senderId: string;
        receiverId: string;
        carId?: string;
        conversationId?: string;
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        car: { select: { id: true, slug: true } },
      },
    });

    // Touch conversation
    if (conversationId) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Realtime fan-out (Ably, server-side): every participant — including
      // the sender's other devices — receives exactly one copy of the
      // persisted message. Best-effort: never blocks/fails the send itself.
      publishConversationEvent(conversationId, 'message-received', message);
    }

    // Notification — detect image messages (IMG: prefix) or legacy emoji prefix
    const msgPreview = validation.data.content.startsWith('IMG:') || validation.data.content.startsWith('📷')
      ? 'صورة مرفقة'
      : validation.data.content.slice(0, 100);

    await prisma.notification.create({
      data: {
        type: 'NEW_MESSAGE',
        title: 'رسالة جديدة',
        message: `لديك رسالة جديدة من ${user.name}`,
        userId: validation.data.receiverId,
        link: `/messages?conversationId=${conversationId || ''}`,
      },
    });

    const receiver = await prisma.user.findUnique({
      where: { id: validation.data.receiverId },
      select: { whatsapp: true, whatsappNotifications: true, name: true },
    });

    if (receiver?.whatsapp && receiver?.whatsappNotifications) {
      const car = message.carId ? await prisma.car.findUnique({
        where: { id: message.carId! },
        select: { price: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } }, year: true },
      }) : null;

      const carTitle = car ? `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}` : '';

      sendWhatsApp(receiver.whatsapp, buildCarMessage('new_message', {
        senderName: user.name,
        carTitle,
        carPrice: car?.price,
        messagePreview: msgPreview,
        carUrl: message.car?.slug,
      }));
    }

    notifyAdmins('NEW_MESSAGE', 'رسالة جديدة', `رسالة جديدة من ${user.name}: ${msgPreview.slice(0, 80)}`, getAdminNotifyLink('NEW_MESSAGE'));

    return successResponse(message, 201);
  } catch (error) {
    return errorResponse('فشل إرسال الرسالة', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { conversationId } = body;

    if (typeof conversationId !== 'string' || !conversationId) {
      return errorResponse('معرّف المحادثة مطلوب');
    }

    const access = await canAccessConversation(conversationId, user.id, user.role);
    if (access === 'NOT_FOUND') return errorResponse('المحادثة غير موجودة', 404);
    if (access === 'FORBIDDEN') return errorResponse('لا تملك صلاحية الوصول إلى هذه المحادثة', 403);

    await prisma.message.updateMany({
      where: { conversationId, receiverId: user.id, read: false },
      data: { read: true },
    });

    return successResponse({ updated: true });
  } catch (error) {
    return errorResponse('فشل تحديث الرسائل', 500);
  }
}
