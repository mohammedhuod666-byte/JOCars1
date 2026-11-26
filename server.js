const { createServer } = require('http');
const path = require('path');
const fs = require('fs');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const dev = false;
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const uploadsDir = path.join(__dirname, 'public', 'uploads');
const mimeTypes = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.avif': 'image/avif',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.webm': 'audio/webm',
  '.js': 'application/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.ico': 'image/x-icon',
};

// CDN cache durations by file type
const cacheDurations = {
  image: 'public, max-age=31536000, immutable',    // 1 year - images don't change
  font: 'public, max-age=31536000, immutable',     // 1 year - fonts don't change
  js: 'public, max-age=86400, stale-while-revalidate=604800',  // 1 day + 7 day stale
  css: 'public, max-age=86400, stale-while-revalidate=604800', // 1 day + 7 day stale
  svg: 'public, max-age=604800',                    // 1 week
  video: 'public, max-age=31536000, immutable',    // 1 year
  default: 'public, max-age=3600',                  // 1 hour
};

function getCacheDuration(ext) {
  const extLower = ext.toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.jfif', '.ico'].includes(extLower)) return cacheDurations.image;
  if (['.woff2', '.woff', '.ttf'].includes(extLower)) return cacheDurations.font;
  if (['.mp4', '.webm', '.mov'].includes(extLower)) return cacheDurations.video;
  if (extLower === '.js') return cacheDurations.js;
  if (extLower === '.css') return cacheDurations.css;
  if (extLower === '.svg') return cacheDurations.svg;
  return cacheDurations.default;
}

function log(level, msg, extra) {
  const ts = new Date().toISOString();
  const line = extra ? `[${ts}] [${level}] ${msg} ${extra}` : `[${ts}] [${level}] ${msg}`;
  if (level === 'ERROR') console.error(line);
  else console.log(line);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Schema changes are applied by the deployment migration step, never by a
// running web server. This keeps application startup read-only and predictable.
//
// schema.prisma uses engineType="client" (WASM) with a driver adapter, so a
// bare `new PrismaClient()` is invalid and cannot connect. server.js must construct
// the SAME HTTP adapter the src/lib/prisma path uses, otherwise every Prisma call
// from server-side code fails at runtime. The reference at the top of this file is
// kept for the existing require; here we just build the adapted client.
const { PrismaNeonHTTP } = require('@prisma/adapter-neon');
const neonAdapter = new PrismaNeonHTTP(process.env.DATABASE_URL, { arrayMode: true });
const prisma = new PrismaClient({ adapter: neonAdapter });

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // لا نفرض مهلة 504 على طلبات المستند الأوّلي:
    // عندما يفتح مستخدم موبايل إعلان سيارة /cars/[id] على شبكة خلوية بطيئة،
    // كانـ req.setTimeout(60000) يُرجع 504 قبل أن تكتمل استجابة Next.js،
    // فلا تصل الاستجابة للمتصفّح ويُظهر صفحة "لا يوجد اتصال بالإنترنت" الأصلية.
    // بدون هذا الفرض، تُترك المهلة للسلوك الافتراضي لـ Node.js/Next.js
    // (أطول بكثير وأكثر رحابة بالشبكات الخلوية).
    // أنظر git log لمحاولات سابقة عكسية على نفس المشكلة.

    const parsedUrl = new URL(req.url || '/', 'http://localhost');

    if (parsedUrl.pathname.startsWith('/uploads/')) {
      const safeName = path.basename(parsedUrl.pathname);
      if (safeName.includes('..') || safeName.includes('\\') || safeName.includes('%')) {
        res.writeHead(400); res.end(); return;
      }
      const filePath = path.join(uploadsDir, safeName);
      const resolvedPath = path.resolve(filePath);
      const uploadsDirResolved = path.resolve(uploadsDir);
      if (!resolvedPath.startsWith(uploadsDirResolved)) {
        res.writeHead(403); res.end(); return;
      }
      try {
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          if (!mimeTypes[ext]) {
            res.writeHead(403); res.end(); return;
          }
          res.writeHead(200, {
            'Content-Type': mimeTypes[ext] || 'application/octet-stream',
            'Cache-Control': getCacheDuration(ext),
            'Accept-Ranges': 'bytes',
          });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      } catch (e) { /* ignore */ }
      res.writeHead(404); res.end(); return;
    }

    // Serve public static files with proper caching
    const publicDir = path.join(__dirname, 'public');
    const publicPath = parsedUrl.pathname;

    if (publicPath.startsWith('/_next/static/') || publicPath.startsWith('/_next/image/')) {
      // Next.js static assets — serve directly with long cache
      const staticExt = path.extname(publicPath);
      if (staticExt) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }

    // Add gzip hint for client
    if (req.headers['accept-encoding']?.includes('gzip')) {
      // Node.js http server handles gzip for us via compression middleware
    }

    handle(req, res).catch((err) => {
      log('ERROR', 'Request error', `${req.url} - ${err.message}`);
      if (!res.headersSent) { res.writeHead(500); res.end('Internal Server Error'); }
    });
  });

  httpServer.on('error', (err) => {
    log('ERROR', 'HTTP server error', err.message);
  });

  httpServer.on('connection', (socket) => {
    // مهلة 4 دقائق (240 ثانية) بدل 2 — شبكات الجوّال الخلوية البطيئة قد
    // تستغرق وقتًا لإرسال مستند /cars/[id] وحزم JS. تدمير socket مبكّر
    // أثناء نقل المستند يجعل المتصفّح يعرض صفحة "لا يوجد اتصال" الأصلية.
    socket.setTimeout(240000);
    socket.setKeepAlive(true, 30000);
    // لا تُدمّر socket نشطًا — الحارس below يحمي الاستجابة الجارية.
    socket.on('timeout', () => {
      if (!socket.writableEnded) socket.destroy();
    });
  });

  // keepAlive/headers فوق 75/85 ثانية ليصفح Connection: keep-alive يبقى
  // حيًّا على الشبكة الخلوية، فلا يضطر المتصفّح لإعادة المصافحة TLS
  // لكل طلب (إعادة المصافحة مكلفة جدًّا على 3G/4G ضعيف).
  httpServer.keepAliveTimeout = 75000;
  httpServer.headersTimeout = 85000;

  const io = new Server(httpServer, {
    cors: { 
      origin: process.env.NEXT_PUBLIC_APP_URL || 'https://jo-cars-production.up.railway.app',
      methods: ['GET', 'POST'] 
    },
    // Mobile-friendly: looser ping timeouts + longer polling window keep
    // slow / unstable cellular connections alive instead of dropping them.
    pingTimeout: 30000,
    pingInterval: 15000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'],
  });

  const onlineUsers = new Map();
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token || !JWT_SECRET) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, { socketId: socket.id, joinedAt: Date.now() });
    io.emit('user-online', { userId });

    const canAccessConversation = async (conversationId) => {
      if (!conversationId || typeof conversationId !== 'string' || conversationId.length > 100) return false;
      if (socket.userRole === 'ADMIN') return true;
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { buyerId: true, sellerId: true },
      });
      return Boolean(conversation && (conversation.buyerId === userId || conversation.sellerId === userId));
    };

    socket.on('join-conversation', async (id) => {
      try {
        if (await canAccessConversation(id)) socket.join(`conversation:${id}`);
      } catch (err) {
        log('WARN', 'Conversation authorization failed', err.message);
      }
    });
    socket.on('leave-conversation', (id) => {
      if (id && typeof id === 'string' && id.length < 100) socket.leave(`conversation:${id}`);
    });
    socket.on('new-message', async (data) => {
      try {
        if (await canAccessConversation(data?.conversationId)) {
        socket.to(`conversation:${data.conversationId}`).emit('message-received', data);
        }
      } catch (err) {
        log('WARN', 'Message event authorization failed', err.message);
      }
    });
    socket.on('typing', async (data) => {
      try {
        if (await canAccessConversation(data?.conversationId)) {
          socket.to(`conversation:${data.conversationId}`).emit('user-typing', { userId });
        }
      } catch (err) {
        log('WARN', 'Typing event authorization failed', err.message);
      }
    });
    socket.on('stop-typing', async (data) => {
      try {
        if (await canAccessConversation(data?.conversationId)) {
        socket.to(`conversation:${data.conversationId}`).emit('user-stop-typing', {});
        }
      } catch (err) {
        log('WARN', 'Typing event authorization failed', err.message);
      }
    });
    socket.on('check-online', (targetUserId) => {
      if (targetUserId && typeof targetUserId === 'string') {
        socket.emit('user-status', { userId: targetUserId, online: onlineUsers.has(targetUserId) });
      }
    });
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user-offline', { userId });
    });
    socket.on('error', () => {
      onlineUsers.delete(userId);
      io.emit('user-offline', { userId });
    });
  });

  setInterval(() => {
    const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    log('INFO', `online=${onlineUsers.size} mem=${mem}MB`);
    if (mem > 500 && global.gc) global.gc();
  }, 60000);

  // ── Automatic Postgres backup every 5 hours ──
  // Calls the internal cron endpoint (guarded by BACKUP_CRON_SECRET).
  // The endpoint dumps all tables to backups/, records it in DB,
  // emails it, and WhatsApps the admins. Set BACKUP_CRON_SECRET in
  // env to enable; without it the scheduler stays idle (manual
  // backups from /admin/backups still work).
  const BACKUP_INTERVAL_MS = 5 * 60 * 60 * 1000;
  async function triggerScheduledBackup(reason) {
    if (!process.env.BACKUP_CRON_SECRET) {
      log('WARN', 'Backup scheduler idle — BACKUP_CRON_SECRET is not set');
      return;
    }
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/cron/backup`, {
        method: 'POST',
        headers: { 'x-cron-secret': process.env.BACKUP_CRON_SECRET },
        signal: AbortSignal.timeout(1000 * 60 * 10),
      });
      const data = await res.json().catch(() => ({}));
      if (data && data.success) {
        log('INFO', `Scheduled backup (${reason}) completed: ${data.data?.name || ''} ${data.data?.sizeFormatted || ''} email=${data.data?.emailSent}`);
      } else {
        log('WARN', `Scheduled backup (${reason}) failed`, JSON.stringify(data).slice(0, 200));
      }
    } catch (e) {
      log('WARN', `Scheduled backup (${reason}) error`, e.message);
    }
  }
  setTimeout(() => triggerScheduledBackup('startup'), 2 * 60 * 1000);
  setInterval(() => triggerScheduledBackup('interval'), BACKUP_INTERVAL_MS);

  // ── Nightly fair-price recalculation (same scheduler secret) ──
  const RECALC_INTERVAL_MS = 24 * 60 * 60 * 1000;
  async function triggerRecalculation(reason) {
    if (!process.env.BACKUP_CRON_SECRET) return; // scheduler disabled
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/cron/recalculate`, {
        method: 'POST',
        headers: { 'x-cron-secret': process.env.BACKUP_CRON_SECRET },
        signal: AbortSignal.timeout(1000 * 60 * 30),
      });
      const data = await res.json().catch(() => ({}));
      log('INFO', `Fair-price recalculation (${reason}): ${data?.data?.recalculated ?? 'failed'}`);
    } catch (e) {
      log('WARN', `Fair-price recalculation (${reason}) error`, e.message);
    }
  }
  setTimeout(() => triggerRecalculation('startup'), 10 * 60 * 1000);
  setInterval(() => triggerRecalculation('interval'), RECALC_INTERVAL_MS);

  // ── Weekly admin WhatsApp report (same scheduler secret) ──
  const WEEKLY_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
  async function triggerWeeklyReport(reason) {
    if (!process.env.BACKUP_CRON_SECRET) return; // scheduler disabled
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/cron/weekly-report`, {
        method: 'POST',
        headers: { 'x-cron-secret': process.env.BACKUP_CRON_SECRET },
        signal: AbortSignal.timeout(1000 * 60 * 5),
      });
      const data = await res.json().catch(() => ({}));
      log('INFO', `Weekly report (${reason}): sent=${data?.data?.sent}`);
    } catch (e) {
      log('WARN', `Weekly report (${reason}) error`, e.message);
    }
  }
  setTimeout(() => triggerWeeklyReport('startup'), 15 * 60 * 1000);
  setInterval(() => triggerWeeklyReport('interval'), WEEKLY_INTERVAL_MS);

  // ── Daily car-news auto-import (same scheduler secret) ──
  const NEWS_INTERVAL_MS = 24 * 60 * 60 * 1000;
  async function triggerNewsImport(reason) {
    if (!process.env.BACKUP_CRON_SECRET) return; // scheduler disabled
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/admin/news-aggregator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cron-secret': process.env.BACKUP_CRON_SECRET },
        body: JSON.stringify({ limit: 12 }),
        signal: AbortSignal.timeout(1000 * 60 * 5),
      });
      const data = await res.json().catch(() => ({}));
      log('INFO', `News auto-import (${reason}): ${data?.data?.message || 'failed'}`);
    } catch (e) {
      log('WARN', `News auto-import (${reason}) error`, e.message);
    }
  }
  setTimeout(() => triggerNewsImport('startup'), 30 * 60 * 1000);
  setInterval(() => triggerNewsImport('interval'), NEWS_INTERVAL_MS);

  httpServer.listen(port, hostname, () => {
    log('INFO', `Ready on http://${hostname}:${port} [production]`);
  });

  process.on('SIGTERM', () => {
    io.close();
    httpServer.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000);
  });
});
