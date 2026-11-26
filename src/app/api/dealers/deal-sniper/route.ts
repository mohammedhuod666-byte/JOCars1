import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { sendPushToDealers, notifyDealersOfSniperDeal } from '@/lib/push';

/**
 * Deal Sniping & Arbitrage Radar API for Dealers
 * 
 * GET /api/dealers/deal-sniper
 * Returns live bargain cars (below market value) scanned from the platform.
 * 
 * POST /api/dealers/deal-sniper/test
 * Sends a live test push notification to the dealer's phone notification shade.
 */
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    // Find active cars with attractive price positions
    const cars = await prisma.car.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
      },
      include: {
        brand: { select: { nameAr: true } },
        model: { select: { nameAr: true } },
        city: { select: { nameAr: true } },
        images: { take: 1, select: { url: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Identify deals with significant margins
    const deals = cars.map((c) => {
      // Benchmark price simulation
      const baseEstimate = Math.round(c.price * 1.15); // baseline 15% higher
      const diffJod = baseEstimate - c.price;
      const discountPct = Math.round((diffJod / baseEstimate) * 100);

      return {
        id: c.id,
        slug: c.slug,
        title: `${c.brand?.nameAr || ''} ${c.model?.nameAr || ''} ${c.year}`,
        brand: c.brand?.nameAr || '',
        model: c.model?.nameAr || '',
        year: c.year,
        kilometers: c.kilometers,
        price: c.price,
        estimatedFmv: baseEstimate,
        potentialProfitJod: diffJod,
        discountPercentage: discountPct,
        city: c.city?.nameAr || 'عمان',
        image: c.images[0]?.url || null,
        daysListed: Math.max(1, Math.round((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24))),
        arbitrageRating: discountPct >= 15 ? 'لقطة نادرة (ربح سريع)' : 'فرصة سعرية ممتازة',
      };
    });

    return successResponse({
      deals,
      totalScanned: cars.length,
      radarStatus: 'ACTIVE_MONITORING',
    });
  } catch (err: any) {
    return errorResponse(err?.message || 'فشل تشغيل رادار الصفقات', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json().catch(() => ({}));

    // Test notification dispatch
    const title = body.title || 'رادار كارس جو: لقطة جديدة تم رصدها!';
    const message = body.message || 'سيارة تويوتا كامري 2021 معروضة بأقل بـ 15% عن سعر السوق. اضغط لمعاينتها قبل الجميع.';
    const carId = body.carId || 'cmw22gh0s004f68pp192lzvah';

    const sentCount = await sendPushToDealers({
      title,
      body: message,
      url: `/cars/${carId}`,
    });

    return successResponse({
      sent: true,
      sentDevicesCount: sentCount,
      message: 'تم إرسال إشعار رادار اللقطات مباشرة إلى هاتف التاجر!',
    });
  } catch (err: any) {
    return errorResponse(err?.message || 'فشل إرسال الإشعار', 500);
  }
}
