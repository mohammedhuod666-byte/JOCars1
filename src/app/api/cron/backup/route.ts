import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api';
import { isCronAuthorized } from '@/lib/cron-auth';
import { runBackup } from '@/lib/backup';
import { notifyAdmins } from '@/lib/admin-notify';

/**
 * Scheduled backup trigger — called by server.js every 5 hours.
 * Guarded by BACKUP_CRON_SECRET (set it in env; requests without the
 * matching secret are rejected).
 */
export async function POST(request: NextRequest) {
  if (!process.env.BACKUP_CRON_SECRET) {
    return errorResponse('الجدولة غير مفعّلة: حدّد BACKUP_CRON_SECRET في البيئة', 503);
  }

  if (!isCronAuthorized(request)) {
    return errorResponse('غير مصرح', 403);
  }

  try {
    const summary = await runBackup({ type: 'AUTO' });
    return successResponse(summary);
  } catch (error) {
    // Alert admins inside the app — silent backup failures are how data loss happens.
    await notifyAdmins('BACKUP_FAILED', 'فشل النسخ الاحتياطي', 'فشل النسخ الاحتياطي المجدول — تحقق من السجلات فورًا', '/admin').catch(() => {});
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
