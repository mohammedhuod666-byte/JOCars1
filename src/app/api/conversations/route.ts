import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { sendWhatsApp, buildCarMessage } from '@/lib/whatsapp';
import { trackMessageSent } from '@/lib/security/sentinel';

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

    const fullConversationInclude = {
      car: { select: { id: true, slug: true, price: true, images: { take: 1, orderBy: { order: 'asc' as const } } } },
      buyer: { select: { id: true, name: true, image: true } },
      seller: { select: { id: true, name: true, image: true } },
    };

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

      let conversation = await prisma.conversation.findFirst({
        where: {
          carId: booking.carId,
          buyerId: booking.buyerId,
          sellerId: booking.dealerId,
        },
        include: fullConversationInclude,
      });

      // Stitch an existing unlinked conversation back to the booking (idempotent).
      if (conversation && !conversation.bookingId) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { bookingId: booking.id },
        }).catch(() => { /* best-effort — unique replay could clash */ });
      }

      if (!conversation) {
        // Neon HTTP: create bare record first, then fetch with relations
        const bare = await prisma.conversation.create({
          data: {
            carId: booking.carId,
            buyerId: booking.buyerId,
            sellerId: booking.dealerId,
            bookingId: booking.id,
          },
        });
        conversation = await prisma.conversation.findUnique({
          where: { id: bare.id },
          include: fullConversationInclude,
        });
      }

      if (!conversation) {
        return errorResponse('تعذر تجهيز المحادثة', 500);
      }

      if (content && content.trim()) {
        const bareMsg = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: user.id,
            receiverId: peerId,
            carId: conversation.carId,
            conversationId: conversation.id,
          },
        });

        const message = await prisma.message.findUnique({
          where: { id: bareMsg.id },
          include: { sender: { select: { id: true, name: true, image: true } } },
        });

        trackMessageSent(user.id).catch(() => {}); // Sentinel: spam burst check

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        }).catch(() => {});

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
          try {
            const bare = await prisma.conversation.create({
              data: { carId: null, buyerId: user.id, sellerId },
            });
            conversation = await prisma.conversation.findUnique({
              where: { id: bare.id },
              include: dmInclude,
            });
          } catch {
            // Concurrent race condition fallback
            conversation = await prisma.conversation.findFirst({
              where: {
                carId: null,
                OR: [
                  { buyerId: user.id, sellerId },
                  { buyerId: sellerId, sellerId: user.id },
                ],
              },
              include: dmInclude,
            });
          }
        }

        if (!conversation) {
          return errorResponse('تعذر تجهيز المحادثة', 500);
        }

        if (content && content.trim()) {
          const bareMsg = await prisma.message.create({
            data: {
              content: content.trim(),
              senderId: user.id,
              receiverId: sellerId,
              carId: null,
              conversationId: conversation.id,
            },
          });

          const message = await prisma.message.findUnique({
            where: { id: bareMsg.id },
            include: {
              sender: { select: { id: true, name: true, image: true } },
            },
          });

          trackMessageSent(user.id).catch(() => {}); // Sentinel: spam burst check

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          }).catch(() => {});

          await prisma.notification.create({
            data: {
              type: 'NEW_MESSAGE',
              title: 'رسالة جديدة',
              message: `رسالة جديدة من ${user.name}`,
              userId: sellerId,
              link: `/messages?conversationId=${conversation.id}`,
            },
          }).catch(() => {});

          return successResponse({ conversation, message }, 201);
        }

        return successResponse({ conversation, message: null });
      }
      return errorResponse('معرّف السيارة والبائع مطلوبان');
    }

    if (user.id === sellerId) {
      return errorResponse('لا يمكنك مراسلة نفسك');
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        carId,
        OR: [
          { buyerId: user.id, sellerId },
          { buyerId: sellerId, sellerId: user.id },
        ],
      },
      include: fullConversationInclude,
    });

    if (!conversation) {
      try {
        const bare = await prisma.conversation.create({
          data: { carId, buyerId: user.id, sellerId },
        });
        conversation = await prisma.conversation.findUnique({
          where: { id: bare.id },
          include: fullConversationInclude,
        });
      } catch {
        // Fallback for concurrent creation race condition
        conversation = await prisma.conversation.findFirst({
          where: {
            carId,
            OR: [
              { buyerId: user.id, sellerId },
              { buyerId: sellerId, sellerId: user.id },
            ],
          },
          include: fullConversationInclude,
        });
      }
    }

    if (!conversation) {
      return errorResponse('تعذر تجهيز المحادثة', 500);
    }

    if (content && content.trim()) {
      const bareMsg = await prisma.message.create({
        data: {
          content: content.trim(),
          senderId: user.id,
          receiverId: sellerId,
          carId,
          conversationId: conversation.id,
        },
      });

      const message = await prisma.message.findUnique({
        where: { id: bareMsg.id },
        include: {
          sender: { select: { id: true, name: true, image: true } },
        },
      });

      trackMessageSent(user.id).catch(() => {}); // Sentinel: spam burst check

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      }).catch(() => {});

      await prisma.notification.create({
        data: {
          type: 'NEW_MESSAGE',
          title: 'رسالة جديدة',
          message: `رسالة جديدة من ${user.name} بخصوص ${conversation.car?.slug || 'سيارة'}`,
          userId: sellerId,
          link: `/messages?conversationId=${conversation.id}`,
        },
      }).catch(() => {});

      try {
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
      } catch (waErr) {
        console.warn('WhatsApp alert failed (non-blocking):', waErr);
      }

      return successResponse({ conversation, message }, 201);
    }

    return successResponse({ conversation, message: null });
  } catch (error) {
    console.error('Conversation create/fetch error:', error);
    return errorResponse('فشل إنشاء المحادثة', 500);
  }
}
