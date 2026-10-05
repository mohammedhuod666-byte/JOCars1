import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';

// GET /api/stories → active (non-expired) stories grouped by user, newest first
export async function GET() {
  try {
    const now = new Date();
    const stories = await prisma.story.findMany({
      where: { expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, name: true, image: true, dealerName: true, dealerLogo: true } },
        car: { select: { id: true, slug: true, price: true } },
      },
    });

    const groups = new Map<string, any>();
    for (const s of stories) {
      if (!groups.has(s.userId)) {
        groups.set(s.userId, {
          user: s.user,
          stories: [],
        });
      }
      groups.get(s.userId).stories.push({
        id: s.id, imageUrl: s.imageUrl, caption: s.caption,
        carId: s.carId, car: s.car, views: s.views, createdAt: s.createdAt,
      });
    }

    return successResponse({ groups: [...groups.values()] });
  } catch {
    return errorResponse('فشل تحميل الستوري', 500);
  }
}

// POST /api/stories { imageUrl, caption?, carId? } → dealers publish 24h story
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  if (user.role !== 'TRADER' && user.role !== 'DEALER' && user.role !== 'ADMIN') {
    return errorResponse('الستوري متاح لحسابات التجار والمعارض فقط', 403);
  }

  // Verification, not just role: self-registered dealers must be approved first.
  if (user.role !== 'ADMIN' && !user.dealerVerified) {
    return errorResponse('حسابك قيد المراجعة — الستوري متاح بعد توثيق حسابك من الإدارة', 403);
  }

  const rateLimit = checkRateLimit(`story:${user.id}`, { windowMs: 60 * 60 * 1000, maxRequests: 20 });
  if (!rateLimit.allowed) return errorResponse('تجاوزت حد النشر — حاول لاحقاً', 429);

  try {
    const body = await request.json();
    const { imageUrl, caption, carId } = body;
    if (!imageUrl || typeof imageUrl !== 'string') return errorResponse('صورة الستوري مطلوبة', 400);

    if (carId) {
      const car = await prisma.car.findUnique({ where: { id: carId }, select: { userId: true } });
      if (!car || (car.userId !== user.id && user.role !== 'ADMIN')) {
        return errorResponse('هذه ليست سيارتك', 403);
      }
    }

    const story = await prisma.story.create({
      data: {
        userId: user.id,
        imageUrl: imageUrl.slice(0, 2000),
        caption: typeof caption === 'string' ? caption.slice(0, 300) : null,
        carId: carId || null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return successResponse(story, 201);
  } catch {
    return errorResponse('فشل نشر الستوري', 500);
  }
}
