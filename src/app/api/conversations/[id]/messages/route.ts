import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { buyerId: true, sellerId: true },
    });

    if (!conversation) {
      return errorResponse('المحادثة غير موجودة', 404);
    }

    const isParticipant =
      conversation.buyerId === user.id ||
      conversation.sellerId === user.id;

    if (!isParticipant && user.role !== 'ADMIN') {
      return errorResponse('غير مصرح لك بالوصول إلى هذه المحادثة', 403);
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '200')));
    const beforeRaw = searchParams.get('before');
    const before = beforeRaw ? new Date(beforeRaw) : null;

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        ...(before && !isNaN(before.getTime()) ? { createdAt: { lt: before } } : {}),
      },
      include: {
        sender: { select: { id: true, name: true, image: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
      // No cursor → latest N (negative take reads from the end, order preserved).
      // With `before` cursor → oldest N before the cursor for "load older" paging.
      take: before ? limit : -limit,
    });

    if (user.role !== 'ADMIN') {
      await prisma.message.updateMany({
        where: { conversationId: id, receiverId: user.id, read: false },
        data: { read: true },
      });
    }

    return successResponse(messages);
  } catch (error) {
    return errorResponse('فشل تحميل الرسائل', 500);
  }
}
