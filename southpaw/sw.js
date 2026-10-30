// Offline cache: the app still opens at the gym without internet.
// Bump VERSION every time you deploy a change so phones pick up the new files.
const VERSION = 'southpaw-v12';
const FILES = ['./', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return; // never cache sync data
  // network first, fall back to cache when offline
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      if (url.origin === location.origin && res.ok) caches.open(VERSION).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./')))
  );
});

// Daily reminder from /api/southpaw-remind
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Southpaw', {
    body: d.body || 'ถึงเวลาซ้อมแล้ว 🥊',
    icon: '/southpaw/icon-192.png',
    badge: '/southpaw/icon-192.png',
    tag: 'southpaw-daily',
    renotify: true,
    data: { url: '/southpaw/' },
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.includes('/southpaw/') && 'focus' in c) return c.focus();
    return self.clients.openWindow('/southpaw/');
  }));
});
