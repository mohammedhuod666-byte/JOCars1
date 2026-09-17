import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { runBackup } from '@/lib/backup';
import { createAuditLog } from '@/lib/audit';

// GET /api/admin/backup/run → list of saved snapshots (from DB)
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return successResponse({ backups });
  } catch {
    return errorResponse('فشل تحميل النسخ', 500);
  }
}

// POST /api/admin/backup/run → create a manual backup now
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || user.role !== 'ADMIN') return unauthorizedResponse();

  try {
    const summary = await runBackup({ type: 'MANUAL', createdBy: user.id });
    await createAuditLog({
      action: 'BACKUP_CREATED', actorId: user.id,
      entityType: 'BACKUP', entityId: summary.name,
      description: `نسخة احتياطية يدوية: ${summary.name} (${summary.sizeFormatted})`,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    }).catch(() => {});
    return successResponse(summary);
  } catch {
    return errorResponse('فشل إنشاء النسخة', 500);
  }
}
