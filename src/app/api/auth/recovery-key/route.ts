import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, verifyPassword } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';
import { generateRecoveryKey, hashRecoveryKeyArgon2id } from '@/lib/security/recovery-key';
import { createAuditLog } from '@/lib/audit';

// GET /api/auth/recovery-key → check if user has an Argon2id recovery key set
export async function GET(request: NextRequest) {
  const viewer = await authenticateRequest(request);
  if (!viewer) return unauthorizedResponse();

  try {
    const user = await prisma.user.findUnique({
      where: { id: viewer.id },
      select: { recoveryKeyHash: true, recoveryKeyCreatedAt: true },
    });
    return successResponse({
      hasRecoveryKey: !!user?.recoveryKeyHash,
      createdAt: user?.recoveryKeyCreatedAt || null,
    });
  } catch {
    return errorResponse('فشل التحقق من حالة مفتاح الاسترداد', 500);
  }
}

// POST /api/auth/recovery-key → generate (for old accounts) or rotate (requires currentPassword if already set)
export async function POST(request: NextRequest) {
  const viewer = await authenticateRequest(request);
  if (!viewer) return unauthorizedResponse();

  try {
    const body = await request.json().catch(() => ({}));
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';

    const user = await prisma.user.findUnique({
      where: { id: viewer.id },
      select: { id: true, password: true, recoveryKeyHash: true },
    });
    if (!user) return unauthorizedResponse();

    const isOAuthAccount = user.password.startsWith('oauth:');
    // If user already has a recovery key AND has a local password, require currentPassword to rotate
    if (user.recoveryKeyHash && !isOAuthAccount) {
      if (!currentPassword) {
        return errorResponse('أدخل كلمة المرور الحالية لتجديد مفتاح الاسترداد', 400);
      }
      const valid = await verifyPassword(currentPassword, user.password);
      if (!valid) {
        return errorResponse('كلمة المرور الحالية غير صحيحة', 401);
      }
    }

    const plainKey = generateRecoveryKey();
    const recoveryKeyHash = hashRecoveryKeyArgon2id(plainKey);
    const now = new Date();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        recoveryKeyHash,
        recoveryKeyCreatedAt: now,
      },
    });

    await createAuditLog({
      action: user.recoveryKeyHash ? 'ROTATE_RECOVERY_KEY' : 'CREATE_RECOVERY_KEY',
      actorId: user.id,
      entityType: 'USER',
      entityId: user.id,
      description: 'توليد مفتاح استرداد سري جديد (Argon2id)',
    }).catch(() => {});

    return successResponse({
      recoveryKey: plainKey,
      createdAt: now.toISOString(),
    });
  } catch {
    return errorResponse('فشل توليد مفتاح الاسترداد', 500);
  }
}
