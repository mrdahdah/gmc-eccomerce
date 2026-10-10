/* Service worker for Web Push (VAPID) in the admin app.
   Registered by src/features/pwa/serviceWorker.ts.

   Kept as a near-copy of the storefront's worker rather than shared: a
   service worker is served per origin, and the two apps deploy separately. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Sent by the "a new version is ready" banner (features/pwa/usePwa.ts) when a
// worker does end up waiting behind an older one.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// App paths ('/notifications') are relative to wherever the admin is mounted
// (the origin root in dev, /admin/ in the combined deployment).
const inScope = (path) => new URL(String(path).replace(/^\//, ''), self.registration.scope).href;

self.addEventListener('push', (event) => {
  // A push with no body still deserves a visible notification, otherwise Chrome
  // shows its own "This site has been updated in the background" placeholder.
  let payload = { title: 'GoMyCode Games Admin', message: 'You have a new notification.', url: '/notifications' };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.message = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.message,
      icon: inScope('icon-192.png'),
      badge: inScope('icon-192.png'),
      data: { url: inScope(payload.url || '/') },
      tag: 'gmc-admin-notification',
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || inScope('/');

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing admin tab rather than opening a duplicate. The
      // storefront shares the origin, so never hijack one of its tabs.
      for (const client of clientList) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
