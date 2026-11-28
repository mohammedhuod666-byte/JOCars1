import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, requireAdmin } from '@/lib/api';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const status = request.nextUrl.searchParams.get('status');
    const priority = request.nextUrl.searchParams.get('priority');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await prisma.ticket.findMany({
      where: where as any,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true },
    });

    return successResponse({ tickets, admins });
  } catch (error) {
    return errorResponse('فشل تحميل التذاكر', 500);
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { ticketId, action } = body;

    if (!ticketId || !action) return errorResponse('بيانات غير صالحة');

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return errorResponse('التذكرة غير موجودة', 404);

    const normalizedAction = String(action).trim().toUpperCase();

    if (normalizedAction === 'ASSIGN') {
      if (!body.assigneeId) return errorResponse('اختر المسؤول');
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { assigneeId: body.assigneeId, status: 'IN_PROGRESS' },
      });
      await createAuditLog({
        action: 'TICKET_ASSIGN', actorId: user.id,
        entityType: 'TICKET', entityId: ticketId,
        description: `تعيين تذكرة "${ticket.subject}"`,
      });
      return successResponse({ success: true });
    }

    if (normalizedAction === 'PROGRESS' || normalizedAction === 'IN_PROGRESS') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS', closedAt: null },
      });
      await createAuditLog({
        action: 'TICKET_PROGRESS', actorId: user.id,
        entityType: 'TICKET', entityId: ticketId,
        description: `تحويل التذكرة "${ticket.subject}" إلى قيد المعالجة`,
      });
      await prisma.notification.create({
        data: {
          type: 'TICKET_UPDATE',
          title: 'تحديث على تذكرتك',
          message: `تذكرتك "${ticket.subject}" أصبحت قيد المعالجة من قِبل فريق الدعم`,
          userId: ticket.userId,
          link: `/tickets/${ticketId}`,
        },
      }).catch(() => {});
      return successResponse({ success: true, status: 'IN_PROGRESS' });
    }

    if (normalizedAction === 'RESOLVE' || normalizedAction === 'RESOLVED') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'RESOLVED' },
      });
      await createAuditLog({
        action: 'TICKET_RESOLVE', actorId: user.id,
        entityType: 'TICKET', entityId: ticketId,
        description: `تم حل تذكرة "${ticket.subject}"`,
      });
      await prisma.notification.create({
        data: {
          type: 'TICKET_UPDATE',
          title: 'تم حل تذكرتك',
          message: `تم حل تذكرتك "${ticket.subject}" بنجاح`,
          userId: ticket.userId,
          link: `/tickets/${ticketId}`,
        },
      }).catch(() => {});
      return successResponse({ success: true, status: 'RESOLVED' });
    }

    if (normalizedAction === 'CLOSE' || normalizedAction === 'CLOSED') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
      await createAuditLog({
        action: 'TICKET_CLOSE', actorId: user.id,
        entityType: 'TICKET', entityId: ticketId,
        description: `إغلاق تذكرة "${ticket.subject}"`,
      });
      await prisma.notification.create({
        data: {
          type: 'TICKET_UPDATE',
          title: 'تم إغلاق تذكرتك',
          message: `تم إغلاق تذكرتك "${ticket.subject}"`,
          userId: ticket.userId,
          link: `/tickets/${ticketId}`,
        },
      }).catch(() => {});
      return successResponse({ success: true, status: 'CLOSED' });
    }

    if (normalizedAction === 'REOPEN') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'OPEN', closedAt: null },
      });
      await createAuditLog({
        action: 'TICKET_REOPEN', actorId: user.id,
        entityType: 'TICKET', entityId: ticketId,
        description: `إعادة فتح تذكرة "${ticket.subject}"`,
      });
      return successResponse({ success: true, status: 'OPEN' });
    }

    if (normalizedAction === 'DELETE') {
      await prisma.ticketMessage.deleteMany({ where: { ticketId } });
      await prisma.ticket.delete({ where: { id: ticketId } });
      await createAuditLog({
        action: 'TICKET_DELETE', actorId: user.id,
        entityType: 'TICKET', entityId: ticketId,
        description: `حذف تذكرة "${ticket.subject}"`,
      });
      return successResponse({ success: true, message: 'تم حذف التذكرة' });
    }

    return errorResponse('إجراء غير معروف');
  } catch (error) {
    return errorResponse('فشل معالجة التذكرة', 500);
  }
}
