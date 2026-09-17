import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api';
import { recalculateAllFairPrices } from '@/lib/fair-price';

/**
 * Nightly fair-price recalculation — called by server.js every 24 hours.
 * Guarded by BACKUP_CRON_SECRET (shared scheduler secret).
 */
export async function POST(request: NextRequest) {
  const configured = process.env.BACKUP_CRON_SECRET;
  if (!configured) {
    return errorResponse('الجدولة غير مفعّلة: حدّد BACKUP_CRON_SECRET في البيئة', 503);
  }

  const headerSecret = request.headers.get('x-cron-secret') || '';
  const querySecret = new URL(request.url).searchParams.get('secret') || '';
  if (headerSecret !== configured && querySecret !== configured) {
    return errorResponse('غير مصرح', 403);
  }

  try {
    const count = await recalculateAllFairPrices();
    return successResponse({ recalculated: count });
  } catch (error) {
    return errorResponse('فشلت إعادة الحساب الليلي', 500);
  }
}

export async function GET() {
  return successResponse({ schedule: 'every 24 hours', enabled: Boolean(process.env.BACKUP_CRON_SECRET) });
}
