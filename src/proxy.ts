import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Adding CSP to prevent XSS. Allowing 'unsafe-inline' for Next.js inline styles/scripts, but restricting external sources.
  response.headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' https: wss:; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://www.openstreetmap.org https://maps.google.com https://maps.googleapis.com https://www.youtube.com https://youtube.com https://youtu.be; media-src 'self' blob: data: https:;");
  return response;
}

// Next.js 16 convention: `proxy.ts` + `export proxy` replaces the
// deprecated `middleware.ts` + `export middleware`.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block path traversal attempts
  if (pathname.includes('..') || pathname.includes('%2e%2e') || pathname.includes('%252e%252e')) {
    return applySecurityHeaders(NextResponse.json({ error: 'Invalid path' }, { status: 400 }));
  }

  // Block common attack vectors
  const blockedPatterns = ['/wp-admin', '/wp-login', '/phpmyadmin', '/.env', '/.git', '/config', '/backup'];
  if (blockedPatterns.some(p => pathname.toLowerCase().startsWith(p))) {
    return applySecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }));
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
        const res = await fetch(`http://ip-api.com/json/${clientIp}?fields=countryCode`, {
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
