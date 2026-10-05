import { NextRequest, NextResponse } from 'next/server';
import dns from 'node:dns/promises';

// Secure same-origin proxy for news article images. External news hosts are
// NOT in the CSP img-src allowlist, so hotlinked images render broken.
// This proxy serves them from our own origin with SSRF guardrails.
const ALLOWED_HOSTS = new Set([
  'alghad.com', 'ammonnews.net', 'khaberni.com', 'royanews.tv',
  'alwakeelnews.com', 'jo24.net', 'imgy.pro',
]);

// Base domains whose subdomains (cdn., img., backend., ...) are also trusted.
function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(host)) return true;
  for (const base of ALLOWED_HOSTS) {
    if (host.endsWith('.' + base)) return true;
  }
  return false;
}

const MAX_BYTES = 6 * 1024 * 1024;

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    return (
      ip === '::1' ||
      ip.toLowerCase().startsWith('fe80') ||
      ip.toLowerCase().startsWith('fc') ||
      ip.toLowerCase().startsWith('fd')
    );
  }
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url') || '';
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ success: false, error: 'رابط غير صالح' }, { status: 400 });
  }

  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return NextResponse.json({ success: false, error: 'رابط غير صالح' }, { status: 400 });
  }
  if (target.username || target.password || target.port) {
    return NextResponse.json({ success: false, error: 'رابط غير صالح' }, { status: 400 });
  }
  const host = target.hostname.toLowerCase().replace(/^www\./, '');
  if (!isAllowedHost(host) && !isAllowedHost(target.hostname)) {
    return NextResponse.json({ success: false, error: 'المضيف غير مسموح' }, { status: 403 });
  }

  try {
    const resolved = await dns.lookup(target.hostname);
    if (isPrivateIp(resolved.address)) {
      return NextResponse.json({ success: false, error: 'المضيف غير مسموح' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'تعذر الوصول للصورة' }, { status: 502 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: { 'User-Agent': 'JO-Cars-NewsBot/1.0', Accept: 'image/*' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok || !res.body) {
      return new NextResponse(null, { status: 502 });
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return new NextResponse(null, { status: 502 });
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_BYTES) {
      return new NextResponse(null, { status: 502 });
    }
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType.split(';')[0],
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Content-Length': String(buf.length),
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
