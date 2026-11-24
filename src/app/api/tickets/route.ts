import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { sendWhatsAppToAdmins, buildAdminMessage } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const status = request.nextUrl.searchParams.get('status');
    const where: Record<string, unknown> = { userId: user.id };
    if (status) where.status = status;

    const tickets = await prisma.ticket.findMany({
      where: where as any,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
    });

    return successResponse(tickets);
  } catch (error) {
    return errorResponse('فشل تحميل التذاكر', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { subject, message, category, priority } = body;

    if (!subject || !message) return errorResponse('العنوان والرسالة مطلوبان');

    // HTTP adapter لا يدعم الكتابات المتداخلة (nested writes) — ننشئ التذكرة
    // ثم رسالة الرسالة الأولى، مع حذف تعويضي للتذكرة لو فشلت الرسالة.
    let createdTicketId: string | null = null;
    let ticket: any;
    try {
      const created = await prisma.ticket.create({
        data: {
          subject,
          message,
          category: category || 'GENERAL',
          priority: priority || 'NORMAL',
          userId: user.id,
        },
      });
      createdTicketId = created.id;

      await prisma.ticketMessage.create({
        data: { content: message, userId: user.id, isStaff: false, ticketId: created.id },
      });

      ticket = await prisma.ticket.findUnique({
        where: { id: created.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          messages: { take: 1, include: { user: { select: { id: true, name: true } } } },
        },
      });
      if (!ticket) throw new Error('ticket row not found right after create');
    } catch (createErr) {
      if (createdTicketId) {
        await prisma.ticketMessage.deleteMany({ where: { ticketId: createdTicketId } }).catch(() => {});
        await prisma.ticket.delete({ where: { id: createdTicketId } }).catch(() => {});
      }
      throw createErr;
    }

    sendWhatsAppToAdmins(buildAdminMessage('new_ticket', {
      userName: user.name, subject, category: category || 'GENERAL', priority: priority || 'NORMAL',
    }));

    return successResponse(ticket);
  } catch (error) {
    return errorResponse('فشل إنشاء التذكرة', 500);
  }
}
