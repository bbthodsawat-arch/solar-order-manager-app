// Legacy Service Worker recovery.
// This project no longer uses a Service Worker because the previous cache-first
// strategy could serve stale SPA HTML/assets and produce a blank production page.
self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});
