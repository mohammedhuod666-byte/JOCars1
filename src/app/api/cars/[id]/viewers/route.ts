import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { successResponse, errorResponse } from '@/lib/api';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Anti-inflation: view counting is anonymous by design, but each IP
    // gets a bounded budget so bots can't pump an ad's view counter.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`viewers:${ip}`, { windowMs: 60 * 1000, maxRequests: 60 });
    if (!rateLimit.allowed) {
      return errorResponse('محاولات كثيرة. حاول بعد دقيقة', 429);
    }

    const body = await request.json().catch(() => ({}));
    const rawSession = typeof body.sessionId === 'string' ? body.sessionId : '';
    // Accept only sane session ids (cuid/uuid-ish), else mint one server-side.
    const sessionId = /^[A-Za-z0-9_-]{8,100}$/.test(rawSession) ? rawSession : crypto.randomUUID();
    const userAgent = (request.headers.get('user-agent') || '').slice(0, 500);

    const existing = await prisma.carViewer.findUnique({
      where: { carId_sessionId: { carId: id, sessionId } },
    });

    if (!existing) {
      await prisma.carViewer.create({
        data: { carId: id, sessionId, ip, userAgent },
      });
      await prisma.car.update({ where: { id }, data: { views: { increment: 1 } } });
    }

    const totalViewers = await prisma.carViewer.count({
      where: { carId: id, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
    });

    const totalViews = await prisma.car.findUnique({ where: { id }, select: { views: true } });

    return successResponse({ viewers: totalViewers, totalViews: totalViews?.views || 0 });
  } catch {
    return errorResponse('فشل تسجيل المشاهدة', 500);
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const totalViewers = await prisma.carViewer.count({
      where: { carId: id, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
    });

    const totalViews = await prisma.car.findUnique({ where: { id }, select: { views: true, saves: true } });

    return successResponse({ viewers: totalViewers, totalViews: totalViews?.views || 0, saves: totalViews?.saves || 0 });
  } catch {
    return errorResponse('فشل تحميل البيانات', 500);
  }
}
