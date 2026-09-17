import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit';

async function getCounts(userId: string) {
  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followersCount, followingCount };
}

// GET /api/users/[id]/follow → { following, followersCount, followingCount }
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) return notFoundResponse('المستخدم');

    const viewer = await authenticateRequest(request).catch(() => null);
    let following = false;
    if (viewer && viewer.id !== id) {
      const rel = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewer.id, followingId: id } },
      });
      following = !!rel;
    }
    return successResponse({ following, ...(await getCounts(id)) });
  } catch {
    return errorResponse('فشل تحميل حالة المتابعة', 500);
  }
}

// POST /api/users/[id]/follow → toggle follow/unfollow
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await authenticateRequest(request);
  if (!viewer) return unauthorizedResponse();

  if (viewer.id === id) return errorResponse('لا يمكنك متابعة نفسك', 400);

  const rateLimit = checkRateLimit(`follow:${viewer.id}`, { windowMs: 60 * 1000, maxRequests: 30 });
  if (!rateLimit.allowed) return errorResponse('محاولات كثيرة. حاول بعد دقيقة', 429);

  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) return notFoundResponse('المستخدم');

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewer.id, followingId: id } },
    });

    let following: boolean;
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      following = false;
    } else {
      await prisma.follow.create({ data: { followerId: viewer.id, followingId: id } });
      following = true;
    }
    await createAuditLog({
      action: following ? 'FOLLOW_USER' : 'UNFOLLOW_USER', actorId: viewer.id,
      entityType: 'USER', entityId: id,
      description: `${following ? 'متابعة' : 'إلغاء متابعة'} المستخدم ${id}`,
    });
    if (following) {
      // Notify the followed user (best-effort)
      await prisma.notification.create({
        data: {
          type: 'NEW_FOLLOWER',
          title: 'متابع جديد',
          message: `${viewer.name} بدأ بمتابعتك`,
          userId: id,
          link: `/profile/${viewer.id}`,
        },
      }).catch(() => {});
    }

    return successResponse({ following, ...(await getCounts(id)) });
  } catch {
    return errorResponse('فشل تحديث المتابعة', 500);
  }
}
