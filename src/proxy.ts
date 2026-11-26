import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

async function reportToSentinel(
  request: NextRequest,
  payload: Record<string, unknown>,
): Promise<void> {
  const secret = process.env.SENTINEL_INTERNAL_SECRET;
  if (!secret) return;
  try {
    const url = new URL('/api/internal/sentinel-probe', request.url);
    await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sentinel-secret': secret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
  } catch { /* sentinel must never break the request */ }
}

async function getTokenUser(request: NextRequest): Promise<{ id: string; role: string; name?: string } | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (typeof payload.userId !== 'string' || typeof payload.role !== 'string') return null;
    return { id: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

function getIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for') || '';
  const first = fwd.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || 'unknown';
}

function geoBlockPage(): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>غير مصرح - JO Cars</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#fff}
    .c{text-align:center;padding:2rem;max-width:600px}
    .i{font-size:5rem;margin-bottom:1.5rem}
    h1{font-size:2rem;font-weight:700;margin-bottom:1rem}
    p{font-size:1.1rem;color:#94a3b8;line-height:1.8}
  </style>
</head>
<body>
  <div class="c">
    <div class="i">&#x1f30d;</div>
    <h1>غير متاح في منطقتك</h1>
    <p>سوق JO Cars متاح فقط للمستخدمين في الأردن.</p>
  </div>
</body>
</html>`,
    { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

function geoBlockApi(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Service not available in your region' },
    { status: 403 }
  );
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  // Strict CSP is defined once in next.config.js headers().
  // (Removed duplicate inline policy — single source of truth.)
  return response;
}

// Edge DDoS / DoS sliding-window burst limiter (per IP, zero external latency)
const edgeRateMap = new Map<string, { count: number; resetAt: number }>();

function checkEdgeRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  // Periodic cleanup to prevent memory growth under distributed floods
  if (edgeRateMap.size > 5000) {
    for (const [k, v] of edgeRateMap.entries()) {
      if (v.resetAt <= now) edgeRateMap.delete(k);
    }
  }
  const entry = edgeRateMap.get(key);
  if (!entry || entry.resetAt <= now) {
    edgeRateMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= maxRequests;
}

// Next.js 16 convention: `proxy.ts` + `export proxy` replaces the
// deprecated `middleware.ts` + `export middleware`.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const search = request.nextUrl.search || '';
  const fullTarget = (pathname + ' ' + search).toLowerCase();
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const clientIp = getIp(request);

  // ── 0. Oversized URL / ReDoS & Edge DDoS/DoS Burst Guard ──
  if (fullTarget.length > 4096) {
    return applySecurityHeaders(NextResponse.json({ error: 'Request URI too long' }, { status: 414 }));
  }

  if (pathname.startsWith('/api/')) {
    const isAuthRoute = pathname.startsWith('/api/auth/');
    const allowedGeneral = checkEdgeRateLimit(`api:${clientIp}`, 150, 60 * 1000);
    const allowedAuth = !isAuthRoute || checkEdgeRateLimit(`auth:${clientIp}`, 25, 60 * 1000);
    if (!allowedGeneral || !allowedAuth) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: 'تم تجاوز الحد المسموح للطلبات. يرجى المحاولة بعد دقيقة.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        )
      );
    }
  }

  // ── Sentinel Deep Intrusion Detection ──
  // 1. Malicious Scanner User Agents
  if (/(sqlmap|nikto|acunetix|dirbuster|gobuster|wpscan|masscan|zgrab|nmap|havij)/i.test(userAgent)) {
    const intruder = await getTokenUser(request).catch(() => null);
    await reportToSentinel(request, {
      kind: 'breach_attempt',
      type: 'SCANNER_PROBE',
      userId: intruder?.id || null,
      userName: intruder?.name || null,
      ip: getIp(request),
      path: pathname,
      detail: `أداة فحص وهجوم أمني: ${userAgent.slice(0, 60)}`,
    });
    return applySecurityHeaders(NextResponse.json({ error: 'Blocked by Sentinel Security Guard' }, { status: 403 }));
  }

  // 2. SQL Injection Patterns
  const sqliPattern = /(\b(union\s+(all\s+)?select|select\s+.*\s+from|insert\s+into|delete\s+from|drop\s+table|update\s+.*\s+set)\b|--|\/\*|\b(sleep|benchmark|extractvalue)\s*\(|'\s*(or|and)\s*'?\d+'?\s*=\s*'?\d+)/i;
  let decodedTarget = fullTarget;
  try { decodedTarget = decodeURIComponent(fullTarget); } catch {}
  if (sqliPattern.test(decodedTarget)) {
    const intruder = await getTokenUser(request).catch(() => null);
    await reportToSentinel(request, {
      kind: 'breach_attempt',
      type: 'SQL_INJECTION',
      userId: intruder?.id || null,
      userName: intruder?.name || null,
      ip: getIp(request),
      path: pathname,
      detail: `محاولة حقن قواعد بيانات (SQL Injection) على ${pathname}`,
    });
    return applySecurityHeaders(NextResponse.json({ error: 'Security Violation: SQL Injection detected' }, { status: 403 }));
  }

  // 3. XSS / Script Injection
  const xssPattern = /(<script\b|javascript:|onerror\s*=|onload\s*=|eval\s*\(|document\.cookie|<iframe\b)/i;
  if (xssPattern.test(decodedTarget)) {
    const intruder = await getTokenUser(request).catch(() => null);
    await reportToSentinel(request, {
      kind: 'breach_attempt',
      type: 'XSS_ATTACK',
      userId: intruder?.id || null,
      userName: intruder?.name || null,
      ip: getIp(request),
      path: pathname,
      detail: `محاولة حقن نصوص خبيثة (XSS Attack) على ${pathname}`,
    });
    return applySecurityHeaders(NextResponse.json({ error: 'Security Violation: XSS detected' }, { status: 403 }));
  }

  // 4. Path Traversal & LFI attempts
  if (pathname.includes('..') || pathname.includes('%2e%2e') || pathname.includes('%252e%252e') || /etc\/passwd|win\.ini|boot\.ini/i.test(decodedTarget)) {
    const intruder = await getTokenUser(request).catch(() => null);
    await reportToSentinel(request, {
      kind: 'breach_attempt',
      type: 'PATH_TRAVERSAL',
      userId: intruder?.id || null,
      userName: intruder?.name || null,
      ip: getIp(request),
      path: pathname,
      detail: `محاولة تخطي مسارات وسيرفرات (Path Traversal): ${pathname}`,
    });
    return applySecurityHeaders(NextResponse.json({ error: 'Invalid path' }, { status: 400 }));
  }

  // CSRF defense for cookie-authenticated browsers: state-changing requests
  // must come from our own origin. Browser cross-site forgeries always carry
  // the attacker's Origin; non-browser clients (mobile apps) send none and
  // stay unaffected. Combined with SameSite=Strict auth cookies.
  const method = request.method.toUpperCase();
  // Skip CSRF for warmup endpoint (public endpoint for reducing cold start latency)
  const isWarmupEndpoint = pathname === '/api/valuations/warmup';
  if ((method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') && pathname.startsWith('/api/') && !isWarmupEndpoint) {
    const origin = request.headers.get('origin');
    if (origin) {
      try {
        const originHost = new URL(origin).host.toLowerCase();
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
        if (originHost !== host.toLowerCase().split(',')[0].trim()) {
          return applySecurityHeaders(NextResponse.json({ success: false, error: 'طلب مرفوض (CSRF)' }, { status: 403 }));
        }
      } catch {
        return applySecurityHeaders(NextResponse.json({ success: false, error: 'طلب مرفوض (CSRF)' }, { status: 403 }));
      }
    }
  }

  // Block common attack vectors (and feed the Sentinel honeypot: every hit
  // is logged as a signal; logged-in hitters are tied to their account).
  const blockedPatterns = ['/wp-admin', '/wp-login', '/phpmyadmin', '/.env', '/.git', '/config', '/backup'];
  if (blockedPatterns.some(p => pathname.toLowerCase().startsWith(p))) {
    const honeyUser = await getTokenUser(request).catch(() => null);
    await reportToSentinel(request, {
      kind: 'signal', type: 'HONEYPOT',
      userId: honeyUser?.id || null, ip: getIp(request),
      detail: `honeypot: ${pathname}`,
    });
    return applySecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }));
  }

  // ── Sentinel admin-probe trap ──
  // Any logged-in NON-ADMIN touching /admin* (pages or APIs) gets an
  // immediate 7-day ban with the reason attached. Guests are only logged.
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const probeUser = await getTokenUser(request).catch(() => null);
    if (probeUser && probeUser.role !== 'ADMIN') {
      await reportToSentinel(request, {
        kind: 'probe', userId: probeUser.id,
        path: pathname, ip: getIp(request),
      });
      return applySecurityHeaders(NextResponse.json(
        { success: false, error: 'محاولة دخول غير مصرح — تم حظر حسابك تلقائياً لمدة 7 أيام' },
        { status: 403 },
      ));
    }
    if (!probeUser) {
      // Guest knock: forensics only (shared IPs are never banned).
      await reportToSentinel(request, {
        kind: 'signal', type: 'ADMIN_PROBE_GUEST',
        userId: null, ip: getIp(request),
        detail: `زائر بدون جلسة: ${pathname}`,
      });
    }
  }

  if (process.env.GEO_RESTRICT_JORDAN === 'true') {
    // In production on platforms like Vercel/Railway, x-forwarded-for is safe. 
    // However, an attacker could send "127.0.0.1" in x-forwarded-for to bypass.
    // We must parse it and check if it's an external IP before trusting it.
    const forwardedStr = request.headers.get('x-forwarded-for') || '';
    const forwardedIps = forwardedStr.split(',').map(ip => ip.trim()).filter(Boolean);
    
    // Fallback to real-ip or remoteAddress
    let clientIp = request.headers.get('x-real-ip') || '127.0.0.1';
    
    // Find the first non-internal IP from x-forwarded-for if present
    for (const ip of forwardedIps) {
      if (ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('172.')) {
        clientIp = ip;
        break;
      }
    }

    if (clientIp !== '127.0.0.1' && clientIp !== '::1' && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
      try {
        const res = await fetch(`https://ip-api.com/json/${encodeURIComponent(clientIp)}?fields=countryCode`, {
          signal: AbortSignal.timeout(3000),
        });
        const data = await res.json();
        if (data.countryCode !== 'JO') {
          if (pathname.startsWith('/api/')) {
            return applySecurityHeaders(geoBlockApi());
          }
          return applySecurityHeaders(geoBlockPage());
        }
      } catch {}
    }
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
