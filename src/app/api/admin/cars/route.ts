import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { scoreListing } from '@/lib/listing-score';

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    if (request.nextUrl.searchParams.get('counts') === 'true') {
      const grouped = await prisma.car.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      });
      const counts: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
      for (const g of grouped) {
        if (g.status in counts) counts[g.status] = g._count._all;
      }
      return successResponse(counts);
    }

    const status = request.nextUrl.searchParams.get('status');
    const search = request.nextUrl.searchParams.get('search') || '';
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (status) where.status = status;

    if (search.trim()) {
      where.OR = [
        { refCode: { contains: search.trim() } },
        { user: { name: { contains: search.trim() } } },
        { user: { email: { contains: search.trim() } } },
        { user: { dealerName: { contains: search.trim() } } },
      ];
    }

    const cars = await prisma.car.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        brand: { select: { nameAr: true, nameEn: true } },
        model: { select: { nameAr: true, nameEn: true } },
        user: { select: { id: true, name: true, email: true, dealerName: true } },
        images: { take: 1, orderBy: { order: 'asc' } },
        // The count, not the rows: moderation only needs to know how many there
        // are, and pulling every image id to count it in JS would be wasteful.
        _count: { select: { images: true } },
      },
    });

    /**
     * Moderation view of the listing's own quality signals.
     *
     * An admin is the only role that should judge whether a listing is worth
     * publishing, so the completeness score and the document state belong on the
     * moderation screen. Both are DERIVED here from the same module the wizard
     * uses (lib/listing-score.ts) rather than recomputed in the UI, so the number
     * a seller sees at step 5 and the number an admin sees at approval cannot
     * drift apart.
     *
     * `documentState` is deliberately coarse and honest. It reports what is on
     * file — it is NOT a claim that the documents were matched against the car,
     * which nobody does automatically. Labelling it "verified" would overstate
     * what the system knows.
     */
    const enriched = cars.map((car) => {
      const score = scoreListing(car as never);
      const hasLicense = !!car.licenseDocUrl;
      const hasInspection = !!car.inspectionDocUrl;
      return {
        ...car,
        completeness: score.percent,
        missingRequired: score.missingRequired.length,
        hasLicenseDoc: hasLicense,
        hasInspectionDoc: hasInspection,
        documentState: hasLicense && hasInspection ? 'COMPLETE' : hasLicense || hasInspection ? 'PARTIAL' : 'NONE',
      };
    });

    return successResponse({ cars: enriched, pagination: { page, limit, hasMore: cars.length === limit } });
  } catch (error) {
    return errorResponse('فشل تحميل السيارات', 500);
  }
}
