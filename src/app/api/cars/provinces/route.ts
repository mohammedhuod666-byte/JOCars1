import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api';

export async function GET() {
  try {
    const provinces = await prisma.province.findMany({
      where: {
        isActive: true,
        slug: {
          in: [
            'amman', 'irbid', 'zarqa', 'balqa', 'madaba', 'karak',
            'maan', 'aqaba', 'mafraq', 'jerash', 'ajloun', 'tafilah'
          ]
        }
      },
      orderBy: { nameAr: 'asc' },
      include: {
        _count: { select: { cities: true } }
      }
    });

    // Ensure the 12 official governorates have high-priority ordering
    const ORDER = ['amman', 'irbid', 'zarqa', 'balqa', 'madaba', 'karak', 'maan', 'aqaba', 'mafraq', 'jerash', 'ajloun', 'tafilah'];
    provinces.sort((a, b) => {
      const idxA = ORDER.indexOf(a.slug);
      const idxB = ORDER.indexOf(b.slug);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.nameAr.localeCompare(b.nameAr, 'ar');
    });

    return successResponse(provinces);
  } catch (error) {
    console.error('Provinces fetch error:', error);
    return errorResponse('فشل تحميل المحافظات', 500);
  }
}
