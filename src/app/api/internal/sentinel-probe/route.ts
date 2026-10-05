import { NextRequest, NextResponse } from 'next/server';
import { recordSignal, enforceProbeBan, type SignalType } from '@/lib/sentinel';
import { SIGNAL_WEIGHTS } from '@/lib/sentinel';

// Ingestion for the edge middleware (proxy.ts), which cannot touch the DB.
// Guarded by a shared secret — never call from browsers.
// Honeypot hits from the same IP+path are deduplicated to one signal per
// 5 minutes so internet-wide bot scans can't flood the signals table.
const honeypotSeen = new Map<string, number>();

export async function POST(request: NextRequest) {
  const secret = process.env.SENTINEL_INTERNAL_SECRET;
  if (!secret || request.headers.get('x-sentinel-secret') !== secret) {
    return NextResponse.json({ success: false }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { kind, userId, userName, path, ip, type, detail } = body;

    if (kind === 'probe' && userId) {
      // Logged-in non-admin on /admin* → immediate 7-day ban.
      await enforceProbeBan(userId, userName || userId, path || '/admin', ip || null);
      return NextResponse.json({ success: true });
    }
    if (kind === 'signal' && type && (SIGNAL_WEIGHTS as any)[type]) {
      if (type === 'HONEYPOT') {
        const key = `${ip || '?'}|${path || detail || ''}`;
        const last = honeypotSeen.get(key) || 0;
        if (Date.now() - last < 5 * 60 * 1000) return NextResponse.json({ success: true, deduped: true });
        if (honeypotSeen.size > 5000) honeypotSeen.clear();
        honeypotSeen.set(key, Date.now());
      }
      await recordSignal({
        userId: userId || null,
        ip: ip || null,
        type: type as SignalType,
        detail: detail || path || null,
      });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
