import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api';
import { runBackup } from '@/lib/backup';

/**
 * Scheduled backup trigger — called by server.js every 5 hours.
 * Guarded by BACKUP_CRON_SECRET (set it in env; requests without the
 * matching secret are rejected).
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
    const summary = await runBackup({ type: 'AUTO' });
    return successResponse(summary);
  } catch (error) {
    return errorResponse('فشل النسخ المجدول', 500);
  }
}

// Health/status for the scheduler (no secret needed — reveals nothing sensitive)
export async function GET() {
  return successResponse({
    schedule: 'every 5 hours',
    enabled: Boolean(process.env.BACKUP_CRON_SECRET),
  });
}
