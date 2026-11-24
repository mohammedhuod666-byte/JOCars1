import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const provinceId = request.nextUrl.searchParams.get('provinceId');
    const where: Record<string, unknown> = { isActive: true };
    if (provinceId) where.provinceId = provinceId;

    const cities = await prisma.city.findMany({
      where: where as any,
      orderBy: { nameAr: 'asc' },
      include: {
        province: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
        _count: { select: { cars: true } },
      },
    });
    return successResponse(cities);
  } catch (error) {
    console.error('Cities fetch error:', error);
    return errorResponse('فشل تحميل المحافظات والمناطق', 500);
  }
}
