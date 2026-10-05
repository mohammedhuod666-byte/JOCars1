import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || ''; // banned | inactive | nopost
    const onlineOnly = searchParams.get('online') === 'true';
    const riskOnly = searchParams.get('risk') === 'true';
    const sort = searchParams.get('sort') || 'newest'; // newest | oldest | lastLogin | lastSeen | cars
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    const and: Record<string, unknown>[] = [];
    if (search) {
      and.push({
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      });
    }
    if (role && ['USER', 'DEALER', 'TRADER', 'ADMIN'].includes(role)) {
      (where as any).role = role;
    }
    if (status === 'banned') {
      (where as any).banStatus = { not: null };
    } else if (status === 'inactive') {
      (where as any).isActive = false;
    } else if (status === 'nopost') {
      (where as any).canPost = false;
    }
    if (onlineOnly) {
      (where as any).lastSeenAt = { gte: new Date(Date.now() - 5 * 60 * 1000) };
    }
    if (riskOnly) {
      // Triage flag (details in the side drawer): account created in the last
      // 7 days AND (has listings OR repeated failed logins OR ever banned).
      and.push({ createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
      and.push({
        OR: [
          { cars: { some: {} } },
          { failedLoginAttempts: { gte: 3 } },
          { banStatus: { not: null } },
        ],
      });
    }
    if (and.length > 0) (where as any).AND = and;

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sort === 'lastLogin') orderBy = { lastLoginAt: { sort: 'desc', nulls: 'last' } };
    else if (sort === 'lastSeen') orderBy = { lastSeenAt: { sort: 'desc', nulls: 'last' } };
    else if (sort === 'cars') orderBy = { cars: { _count: 'desc' } };

    const [total, users] = await Promise.all([
      prisma.user.count({ where: where as any }),
      prisma.user.findMany({
        where: where as any,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true, name: true, email: true, role: true, phone: true,
          isActive: true, canPost: true, banStatus: true, banReason: true,
          banUntil: true, lastLoginAt: true, lastLoginIp: true, lastSeenAt: true,
          failedLoginAttempts: true,
          dealerName: true, rating: true, createdAt: true,
          badges: true,
          _count: { select: { cars: true } },
        },
      }),
    ]);

    return successResponse({
      users,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: skip + users.length < total,
    });
  } catch (error) {
    return errorResponse('فشل تحميل المستخدمين', 500);
  }
}
