import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

// Lightweight presence heartbeat — called by the client every few minutes
// while the user has the site open. Powers the "online now" indicator.
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });
    return successResponse({ ok: true });
  } catch {
    return errorResponse('فشل تحديث التواجد', 500);
  }
}
