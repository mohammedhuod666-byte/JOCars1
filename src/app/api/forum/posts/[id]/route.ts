import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.forumPost.findUnique({ where: { id } });
  if (!post) return Response.json({ error: 'غير موجود' }, { status: 404 });
  if (post.userId !== user.id && user.role !== 'ADMIN') return Response.json({ error: 'لا تملك صلاحية' }, { status: 403 });

  await prisma.forumPost.delete({ where: { id } });

  const remainingPosts = await prisma.forumPost.count({ where: { topicId: post.topicId } });
  const lastPost = remainingPosts > 0
    ? await prisma.forumPost.findFirst({ where: { topicId: post.topicId }, orderBy: { createdAt: 'desc' } })
    : null;

  await prisma.forumTopic.update({
    where: { id: post.topicId },
    data: { lastPostAt: lastPost?.createdAt || new Date() },
  });

  return Response.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: { topic: true },
  });
  if (!post) return Response.json({ error: 'غير موجود' }, { status: 404 });

  const { action } = await request.json();

  if (action === 'like') {
    // One like per user: second tap removes the like (toggle)
    const existing = await prisma.forumPostLike.findUnique({
      where: { postId_userId: { postId: id, userId: user.id } },
    });
    let liked: boolean;
    if (existing) {
      await prisma.forumPostLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await prisma.forumPostLike.create({ data: { postId: id, userId: user.id } });
      liked = true;
    }
    // Reconcile counter with reality (heals counts inflated by the old bug)
    const likeCount = await prisma.forumPostLike.count({ where: { postId: id } });
    const updated = await prisma.forumPost.update({
      where: { id },
      data: { likeCount },
    });
    return Response.json({ success: true, data: { ...updated, likedByMe: liked } });
  }

  if (action === 'toggleHide') {
    if (user.role !== 'ADMIN') return Response.json({ error: 'صلاحية أدمن مطلوبة' }, { status: 403 });
    const updated = await prisma.forumPost.update({
      where: { id },
      data: { isHidden: !post.isHidden },
    });
    return Response.json({ success: true, data: updated });
  }

  if (action === 'markAnswer') {
    const isTopicOwner = post.topic.userId === user.id;
    if (!isTopicOwner && user.role !== 'ADMIN') {
      return Response.json({ error: 'صلاحية غير كافية' }, { status: 403 });
    }
    const updated = await prisma.forumPost.update({
      where: { id },
      data: { isAnswer: !post.isAnswer },
    });

    await prisma.forumTopic.update({
      where: { id: post.topicId },
      data: { isSolved: true },
    });

    return Response.json({ success: true, data: updated });
  }

  return Response.json({ error: 'إجراء غير معروف' }, { status: 400 });
}
