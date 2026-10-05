import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { sendWhatsApp, buildCarMessage } from '@/lib/whatsapp';
import { trackMessageSent } from '@/lib/sentinel';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
      include: {
        car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } } },
        buyer: { select: { id: true, name: true, image: true } },
        seller: { select: { id: true, name: true, image: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: {
          select: {
            messages: { where: { read: false, receiverId: user.id } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    });

    const enriched = conversations.map((c) => {
      const lastMsg = c.messages[0] || null;
      return { ...c, lastMessage: lastMsg, unreadCount: c._count.messages };
    });

    return NextResponse.json(
      { success: true, data: enriched, pagination: { page, limit, hasMore: enriched.length === limit } },
      { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  } catch (error) {
    return errorResponse('فشل تحميل المحادثات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { carId, sellerId, content, bookingId } = body;

    // Booking-linked path — when `bookingId` is supplied we resolve
    // carId/buyerId/sellerId from the booking record (authoritative), and
    // reuse the conversation that the dealer's accept-flow already created
    // (or upsert one if missing). Caller must be a party of the booking.
    if (bookingId) {
      const booking = await prisma.carBooking.findUnique({
        where: { id: bookingId },
        select: { id: true, carId: true, buyerId: true, dealerId: true },
      });
      if (!booking) return errorResponse('الحجز غير موجود', 404);
      if (booking.buyerId !== user.id && booking.dealerId !== user.id) {
        return errorResponse('غير مصرح لك بالوصول إلى محادثة هذا الحجز', 403);
      }
      if (booking.buyerId === booking.dealerId) {
        return errorResponse('لا يمكنك مراسلة نفسك');
      }
      const peerId = booking.buyerId === user.id ? booking.dealerId : booking.buyerId;

      let conversation = await prisma.conversation.findUnique({
        where: { carId_buyerId_sellerId: {
          carId: booking.carId, buyerId: booking.buyerId, sellerId: booking.dealerId,
        } },
        include: {
          car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } } },
          buyer: { select: { id: true, name: true, image: true } },
          seller: { select: { id: true, name: true, image: true } },
        },
      });

      // Stitch an existing unlinked conversation back to the booking (idempotent).
      if (conversation && !conversation.bookingId) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { bookingId: booking.id },
        }).catch(() => { /* best-effort — unique replay could clash */ });
      }

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            carId: booking.carId, buyerId: booking.buyerId, sellerId: booking.dealerId,
            bookingId: booking.id,
          },
          include: {
            car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } } },
            buyer: { select: { id: true, name: true, image: true } },
            seller: { select: { id: true, name: true, image: true } },
          },
        });
      }

      if (content && content.trim()) {
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: user.id,
            receiverId: peerId,
            carId: conversation.carId,
            conversationId: conversation.id,
          },
          include: { sender: { select: { id: true, name: true, image: true } } },
        });

        trackMessageSent(user.id).catch(() => {}); // Sentinel: spam burst check

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });

        await prisma.notification.create({
          data: {
            type: 'NEW_MESSAGE',
            title: 'رسالة جديدة',
            message: `رسالة جديدة من ${user.name} بخصوص ${conversation.car?.slug || 'سيارة'}`,
            userId: peerId,
            link: `/messages?conversationId=${conversation.id}`,
          },
        }).catch(() => { /* best-effort */ });

        return successResponse({ conversation, message }, 201);
      }
      return successResponse({ conversation, message: null });
    }

    if (!carId || !sellerId) {
      // ── Direct user-to-user chat started from a profile (no car context) ──
      if (!carId && sellerId) {
        if (user.id === sellerId) {
          return errorResponse('لا يمكنك مراسلة نفسك');
        }
        const peer = await prisma.user.findUnique({
          where: { id: sellerId },
          select: { id: true, name: true, image: true },
        });
        if (!peer) return errorResponse('المستخدم غير موجود', 404);

        const dmInclude = {
          buyer: { select: { id: true, name: true, image: true } },
          seller: { select: { id: true, name: true, image: true } },
        };

        let conversation = await prisma.conversation.findFirst({
          where: {
            carId: null,
            OR: [
              { buyerId: user.id, sellerId },
              { buyerId: sellerId, sellerId: user.id },
            ],
          },
          include: dmInclude,
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: { carId: null, buyerId: user.id, sellerId },
            include: dmInclude,
          });
        }

        if (content && content.trim()) {
          const message = await prisma.message.create({
            data: {
              content: content.trim(),
              senderId: user.id,
              receiverId: sellerId,
              carId: null,
              conversationId: conversation.id,
            },
            include: {
              sender: { select: { id: true, name: true, image: true } },
            },
          });

          trackMessageSent(user.id).catch(() => {}); // Sentinel: spam burst check

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          });

          await prisma.notification.create({
            data: {
              type: 'NEW_MESSAGE',
              title: 'رسالة جديدة',
              message: `رسالة جديدة من ${user.name}`,
              userId: sellerId,
              link: `/messages?conversationId=${conversation.id}`,
            },
          });

          return successResponse({ conversation, message }, 201);
        }

        return successResponse({ conversation, message: null });
      }
      return errorResponse('معرّف السيارة والبائع مطلوبان');
    }

    if (user.id === sellerId) {
      return errorResponse('لا يمكنك مراسلة نفسك');
    }

    let conversation = await prisma.conversation.findUnique({
      where: { carId_buyerId_sellerId: { carId, buyerId: user.id, sellerId } },
      include: {
        car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } } },
        buyer: { select: { id: true, name: true, image: true } },
        seller: { select: { id: true, name: true, image: true } },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { carId, buyerId: user.id, sellerId },
        include: {
          car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } } },
          buyer: { select: { id: true, name: true, image: true } },
          seller: { select: { id: true, name: true, image: true } },
        },
      });
    }

    if (content && content.trim()) {
      const message = await prisma.message.create({
        data: {
          content: content.trim(),
          senderId: user.id,
          receiverId: sellerId,
          carId,
          conversationId: conversation.id,
        },
        include: {
          sender: { select: { id: true, name: true, image: true } },
        },
      });

      trackMessageSent(user.id).catch(() => {}); // Sentinel: spam burst check

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      await prisma.notification.create({
        data: {
          type: 'NEW_MESSAGE',
          title: 'رسالة جديدة',
          message: `رسالة جديدة من ${user.name} بخصوص ${conversation.car?.slug || 'سيارة'}`,
          userId: sellerId,
          link: `/messages?conversationId=${conversation.id}`,
        },
      });

      const seller = await prisma.user.findUnique({
        where: { id: sellerId },
        select: { whatsapp: true, whatsappNotifications: true },
      });

      if (seller?.whatsapp && seller?.whatsappNotifications) {
        const car = await prisma.car.findUnique({
          where: { id: carId },
          select: { price: true, brand: { select: { nameAr: true } }, model: { select: { nameAr: true } }, year: true },
        });

        const carTitle = car ? `${car.brand?.nameAr || ''} ${car.model?.nameAr || ''} ${car.year}` : '';

        sendWhatsApp(seller.whatsapp, buildCarMessage('new_conversation', {
          senderName: user.name,
          carTitle,
          carPrice: car?.price,
          messagePreview: content?.slice(0, 100),
        }));
      }

      return successResponse({ conversation, message }, 201);
    }

    return successResponse({ conversation, message: null });
  } catch (error) {
    return errorResponse('فشل إنشاء المحادثة', 500);
  }
}
