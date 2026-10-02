import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';
import type { CapabilityOp } from 'ably';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { errorResponse, unauthorizedResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';

// This Ably key has token revocation enabled, which caps TTL at 1 hour
// (Ably error 40003: "Excessive value for ttl ... limited to a TTL of one
// hour"). Clients renew automatically through the authUrl before expiry.
const TOKEN_TTL_MS = 60 * 60 * 1000;
const PRESENCE_CHANNEL = 'presence:users';

/**
 * Issues an Ably token request for the authenticated user.
 *
 * The Ably API key never reaches the browser: clients POST here with their
 * JWT and receive a short-lived token whose capability is scoped to
 * - `presence:users`  -> online/offline presence
 * - `conversation:<id>` -> only conversations the user actually participates in
 * Admins additionally get `conversation:*` so the admin inbox can observe all
 * rooms (mirrors the old server.js rule where ADMIN could join any room).
 */
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) return unauthorizedResponse();

  const key = process.env.ABLY_API_KEY;
  if (!key) return errorResponse('الدردشة اللحظية غير مفعلة على الخادم', 503);

  try {
    const capability: Record<string, CapabilityOp[]> = {
      [PRESENCE_CHANNEL]: ['subscribe', 'presence'],
    };

    if (user.role === 'ADMIN') {
      capability['conversation:*'] = ['subscribe', 'publish'];
    } else {
      const conversations = await prisma.conversation.findMany({
        where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
        select: { id: true },
        take: 2000,
      });
      for (const conversation of conversations) {
        capability[`conversation:${conversation.id}`] = ['subscribe', 'publish'];
      }
    }

    const rest = new Ably.Rest({ key });
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId: user.id,
      capability,
      ttl: TOKEN_TTL_MS,
    });

    // The Ably SDK expects the RAW TokenRequest/TokenDetails at the top level
    // of the response body (it reads `keyName` / `issued` directly). Wrapping it
    // in the app's { success, data } envelope makes the SDK reject the response
    // with "The returned object has neither a keyName nor an issued field".
    return NextResponse.json(tokenRequest, { status: 200 });
  } catch (error) {
    console.error('[realtime] token issue failed:', error);
    return errorResponse('فشل إصدار توكن المحادثة', 500);
  }
}
