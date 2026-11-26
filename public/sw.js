/* JO Cars service worker — installable PWA + offline-tolerant caching */
const STATIC_CACHE = 'jocars-static-v2';
const PAGES_CACHE = 'jocars-pages-v2';

const PRECACHE = ['/favicon.png', '/logo.png', '/shield-logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept Next.js build chunks or RSC requests so stale chunks never break routing/hydration
  if (url.pathname.startsWith('/_next/') || url.searchParams.has('_rsc')) {
    return;
  }

  // Static images/fonts: cache-first
  if (
    url.pathname.startsWith('/uploads/') ||
    /\.(png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit;
        return fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => Response.error());
      })
    );
    return;
  }

  // Pages: network-first, fall back to cached page if offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('/')))
    );
  }
});

/* ── Web Push notifications (price drops, new matches) ── */
self.addEventListener('push', (event) => {
  let data = { title: 'JO Cars', body: 'لديك تنبيه جديد', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* keep defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/shield-logo.png',
      badge: '/favicon.png',
      dir: 'rtl',
      lang: 'ar',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
