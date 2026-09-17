import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';

// POST /api/stories/[id] { action: 'view' } → count a view
// DELETE /api/stories/[id] → owner removes their story
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'view') {
      await prisma.story.update({
        where: { id },
        data: { views: { increment: 1 } },
      }).catch(() => {});
      return successResponse({ ok: true });
    }
    return errorResponse('إجراء غير معروف', 400);
  } catch {
    return errorResponse('فشل', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) return notFoundResponse('الستوري');
    if (story.userId !== user.id && user.role !== 'ADMIN') return errorResponse('غير مصرح', 403);

    await prisma.story.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse('فشل الحذف', 500);
  }
}
