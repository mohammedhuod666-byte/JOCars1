import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { createAuditLog } from '@/lib/audit';

async function getCounts(userId: string) {
  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followersCount, followingCount };
}

// GET /api/users/[id]/follow
//   default: → { following, isFollower, followersCount, followingCount }
//   ?list=followers|following → { users, followersCount, followingCount }
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listType = request.nextUrl.searchParams.get('list');

  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) return notFoundResponse('المستخدم');

    const viewer = await authenticateRequest(request).catch(() => null);

    if (listType === 'followers' || listType === 'following') {
      const relations =
        listType === 'followers'
          ? await prisma.follow.findMany({
              where: { followingId: id },
              orderBy: { createdAt: 'desc' },
              take: 100,
              include: {
                follower: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    dealerName: true,
                    role: true,
                    phoneVerified: true,
                  },
                },
              },
            })
          : await prisma.follow.findMany({
              where: { followerId: id },
              orderBy: { createdAt: 'desc' },
              take: 100,
              include: {
                following: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    dealerName: true,
                    role: true,
                    phoneVerified: true,
                  },
                },
              },
            });

      const rawUsers = relations.map((r: any) => (listType === 'followers' ? r.follower : r.following));
      const userIds = rawUsers.map((u: any) => u.id);

      let viewerFollowingSet = new Set<string>();
      let viewerFollowersSet = new Set<string>();

      if (viewer && userIds.length > 0) {
        const [vFollowing, vFollowers] = await Promise.all([
          prisma.follow.findMany({
            where: { followerId: viewer.id, followingId: { in: userIds } },
            select: { followingId: true },
          }),
          prisma.follow.findMany({
            where: { followingId: viewer.id, followerId: { in: userIds } },
            select: { followerId: true },
          }),
        ]);
        viewerFollowingSet = new Set(vFollowing.map((x) => x.followingId));
        viewerFollowersSet = new Set(vFollowers.map((x) => x.followerId));
      }

      const users = rawUsers.map((u: any) => ({
        ...u,
        isFollowing: viewerFollowingSet.has(u.id),
        followsViewer: viewerFollowersSet.has(u.id),
      }));

      return successResponse({ users, ...(await getCounts(id)) });
    }

    let following = false;
    let isFollower = false;
    if (viewer && viewer.id !== id) {
      const [relOut, relIn] = await Promise.all([
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewer.id, followingId: id } },
        }),
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: id, followingId: viewer.id } },
        }),
      ]);
      following = !!relOut;
      isFollower = !!relIn;
    }

    return successResponse({ following, isFollower, ...(await getCounts(id)) });
  } catch {
    return errorResponse('فشل تحميل بيانات المتابعة', 500);
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
      action: following ? 'FOLLOW_USER' : 'UNFOLLOW_USER',
      actorId: viewer.id,
      entityType: 'USER',
      entityId: id,
      description: `${following ? 'متابعة' : 'إلغاء متابعة'} المستخدم ${id}`,
    });

    if (following) {
      await prisma.notification
        .create({
          data: {
            type: 'NEW_FOLLOWER',
            title: 'متابع جديد',
            message: `${viewer.name} بدأ بمتابعتك`,
            userId: id,
            link: `/profile/${viewer.id}`,
          },
        })
        .catch(() => {});
    }

    return successResponse({ following, ...(await getCounts(id)) });
  } catch {
    return errorResponse('فشل تحديث المتابعة', 500);
  }
}
