import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api';
import { isCronAuthorized } from '@/lib/security/cron-auth';
import { recalculateAllFairPrices } from '@/lib/cars/fair-price';

/**
 * Nightly fair-price recalculation — called by server.js every 24 hours.
 * Guarded by BACKUP_CRON_SECRET (shared scheduler secret).
 */
export const maxDuration = 300; // nightly recalc can exceed the default serverless limit

export async function POST(request: NextRequest) {
  if (!process.env.BACKUP_CRON_SECRET) {
    return errorResponse('الجدولة غير مفعّلة: حدّد BACKUP_CRON_SECRET في البيئة', 503);
  }

  if (!isCronAuthorized(request)) {
    return errorResponse('غير مصرح', 403);
  }

  try {
    const count = await recalculateAllFairPrices();
    return successResponse({ recalculated: count });
  } catch (error) {
    return errorResponse('فشلت إعادة الحساب الليلي', 500);
  }
}

export async function GET(request: NextRequest) {
  // Vercel Cron fires GET + Authorization: Bearer <CRON_SECRET> — run the job
  // only when authorized; unauthenticated callers just see the schedule info.
  if (process.env.BACKUP_CRON_SECRET && isCronAuthorized(request)) return POST(request);
  return successResponse({ schedule: 'every 24 hours', enabled: Boolean(process.env.BACKUP_CRON_SECRET) });
}
