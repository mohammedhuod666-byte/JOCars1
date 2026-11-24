import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const topic = await prisma.forumTopic.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      user: { select: { id: true, name: true, image: true, dealerName: true, rating: true, ratingCount: true, phoneVerified: true } },
      category: { select: { id: true, nameAr: true, nameEn: true, slug: true, icon: true, color: true } },
      posts: {
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'asc' },
        ],
        include: {
          user: { select: { id: true, name: true, image: true, dealerName: true, rating: true, ratingCount: true, role: true, badges: true, phoneVerified: true } },
        },
      },
    },
  });

  if (!topic) return Response.json({ success: false, error: 'الموضوع غير موجود' }, { status: 404 });

  const trackView = request.nextUrl.searchParams.get('trackView') === 'true';
  if (trackView) {
    await prisma.forumTopic.update({ where: { id: topic.id }, data: { views: { increment: 1 } } }).catch(() => {});
  }

  // Annotate which posts the viewer already liked (one like per user)
  let likedIds = new Set<string>();
  try {
    const viewer = await authenticateRequest(request).catch(() => null);
    if (viewer) {
      const likes = await prisma.forumPostLike.findMany({
        where: { userId: viewer.id, postId: { in: topic.posts.map((p: any) => p.id) } },
        select: { postId: true },
      });
      likedIds = new Set(likes.map((l) => l.postId));
    }
  } catch { /* ignore — treat as not liked */ }

  const posts = topic.posts.map((p: any) => ({ ...p, likedByMe: likedIds.has(p.id) }));

  return Response.json({ success: true, data: { ...topic, posts, views: trackView ? topic.views + 1 : topic.views } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ success: false, error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 });

  const topic = await prisma.forumTopic.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!topic) return Response.json({ error: 'الموضوع غير موجود' }, { status: 404 });

  const isOwner = topic.userId === user.id;
  const isAdmin = user.role === 'ADMIN';

  const body = await request.json();
  const safeData: Record<string, any> = {};

  if ('action' in body) {
    if (body.action === 'like') {
      const updated = await prisma.forumTopic.update({ where: { id: topic.id }, data: { likeCount: { increment: 1 } } });
      return Response.json({ success: true, data: updated });
    }
    if (body.action === 'toggleSolved' && (isOwner || isAdmin)) {
      const updated = await prisma.forumTopic.update({ where: { id: topic.id }, data: { isSolved: !topic.isSolved } });
      return Response.json({ success: true, data: updated });
    }
    if (body.action === 'toggleLocked' && (isOwner || isAdmin)) {
      const updated = await prisma.forumTopic.update({ where: { id: topic.id }, data: { isLocked: !topic.isLocked } });
      return Response.json({ success: true, data: updated });
    }
    if (body.action === 'togglePinned' && isAdmin) {
      const updated = await prisma.forumTopic.update({ where: { id: topic.id }, data: { isPinned: !topic.isPinned } });
      return Response.json({ success: true, data: updated });
    }
  }

  if (isAdmin) {
    const allowedFields = ['title', 'content', 'categoryId', 'isPinned', 'isLocked', 'isSolved'];
    for (const key of allowedFields) {
      if (key in body) safeData[key] = body[key];
    }
    const updated = await prisma.forumTopic.update({ where: { id: topic.id }, data: safeData });
    return Response.json({ success: true, data: updated });
  }

  return Response.json({ error: 'غير مسموح' }, { status: 403 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ success: false, error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 });

  const topic = await prisma.forumTopic.findUnique({ where: { id } });
  if (!topic) return Response.json({ error: 'غير موجود' }, { status: 404 });
  if (topic.userId !== user.id && user.role !== 'ADMIN') return Response.json({ error: 'لا تملك صلاحية' }, { status: 403 });

  await prisma.forumPost.deleteMany({ where: { topicId: id } });
  await prisma.forumTopic.delete({ where: { id } });

  return Response.json({ success: true });
}
