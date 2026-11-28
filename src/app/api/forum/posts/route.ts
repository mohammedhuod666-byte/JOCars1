import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { sanitizeHtml } from '@/lib/security/sanitize';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return Response.json({ success: false, error: 'يرجى تسجيل الدخول أولاً لتتمكن من الرد' }, { status: 401 });
    }
    if (user.forumBannedCommentUntil && new Date(user.forumBannedCommentUntil) > new Date()) {
      return Response.json({ success: false, error: 'تم حظرك من التعليق في المنتدى مؤقتاً' }, { status: 403 });
    }

    const rateLimit = checkRateLimit(`forum-post:${user.id}`, RATE_LIMITS.FORUM);
    if (!rateLimit.allowed) {
      return Response.json({ success: false, error: 'تم تجاوز الحد المسموح، يرجى الانتظار قليلاً' }, { status: 429 });
    }

    const { content, topicId, images, replyToId, replyToUser, replyToContent } = await request.json();
    if (!content || !topicId) {
      return Response.json({ success: false, error: 'المحتوى والموضوع مطلوب' }, { status: 400 });
    }
    if (content.length > 10000) {
      return Response.json({ success: false, error: 'المحتوى طويل جداً' }, { status: 400 });
    }

    const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } });
    if (!topic) return Response.json({ success: false, error: 'الموضوع غير موجود' }, { status: 404 });
    if (topic.isLocked) return Response.json({ success: false, error: 'الموضوع مغلق ولا يقبل ردوداً جديدة' }, { status: 400 });

    // Note: Do NOT use `include` inside `create` with PrismaNeonHTTP because Prisma attempts an internal transaction.
    const post = await prisma.forumPost.create({
      data: {
        content: sanitizeHtml(content),
        topicId,
        userId: user.id,
        images: Array.isArray(images) ? JSON.stringify(images) : (typeof images === 'string' ? images : '[]'),
        replyToId: replyToId || null,
        replyToUser: replyToUser || null,
        replyToContent: replyToContent ? sanitizeHtml(replyToContent) : null,
      },
    });

    await prisma.forumTopic.update({
      where: { id: topicId },
      data: { lastPostAt: new Date() },
    });

    const fullPost = {
      ...post,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        dealerName: user.dealerName,
        rating: user.rating,
        ratingCount: user.ratingCount,
        role: user.role,
        badges: user.badges,
      },
    };

    return Response.json({ success: true, data: fullPost }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating forum post:', err);
    return Response.json({ success: false, error: err.message || 'حدث خطأ أثناء إضافة الرد' }, { status: 500 });
  }
}
