// LunaSync Service Worker v2
// Handles: caching (offline), push notification display, notification click
const CACHE_NAME = 'lunasync-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ── Install: cache core assets ─────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ─────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first (offline support) ──────────────────────
self.addEventListener('fetch', event => {
  // Only cache same-origin GET requests
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(resp => {
          // Cache new responses
          const clone = resp.clone();
          if (resp.ok) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return resp;
        })
      )
  );
});

// ── Show notification (called via showNotification from app) ──
// iOS PWA: notifications must be shown via service worker
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🌙 LunaSync';
  const options = {
    body: data.body || 'Check her energy forecast today.',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: 'lunasync-alert',
    renotify: true,
    data: { url: './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click → open app ─────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // If app is already open, focus it
        const existingWindow = windowClients.find(c => c.url && c.focused !== false);
        if (existingWindow) return existingWindow.focus();
        // Otherwise open a new window
        return clients.openWindow(event.notification.data?.url || './');
      })
  );
});

// ── Message from app → schedule local notification ─────────────
// App posts: { type: 'SCHEDULE_NOTIFICATION', title, body, delayMs, tag }
self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delayMs, tag } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title || '🌙 LunaSync', {
        body: body || '',
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        tag: tag || 'lunasync-alert',
        renotify: true
      });
    }, Math.max(0, delayMs));
  }
});
