import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

// Lightweight client-error telemetry (no external dependency).
// Captures browser crashes to the server log so production errors surface
// without waiting for user reports. For full APM, add Sentry later.
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`client-errors:${ip}`, { windowMs: 60 * 1000, maxRequests: 20 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false }, { status: 429 });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body.message !== 'string') {
      return NextResponse.json({ success: false, error: 'invalid payload' }, { status: 400 });
    }
    console.log(JSON.stringify({
      level: 'CLIENT_ERROR',
      message: body.message.slice(0, 500),
      stack: typeof body.stack === 'string' ? body.stack.slice(0, 2000) : undefined,
      url: typeof body.url === 'string' ? body.url.slice(0, 500) : undefined,
      ua: (request.headers.get('user-agent') || '').slice(0, 300),
      ip,
    }));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
