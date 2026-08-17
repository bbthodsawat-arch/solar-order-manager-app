const CACHE_NAME = 'solar-pos-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

// Install Event: Pre-cache critical application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup older outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First with Network Fallback or SPA fallback for pages
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip caching for Firebase APIs, auth, firestore, or any external analytics
  if (
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith('/api') ||
    requestUrl.href.includes('firestore.googleapis.com') ||
    requestUrl.href.includes('securetoken.googleapis.com') ||
    requestUrl.href.includes('identitytoolkit.googleapis.com') ||
    requestUrl.href.includes('firebase')
  ) {
    return; // Bypass Service Worker cache
  }

  // Intercept local GET requests
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch from network in background to keep cache fresh (stale-while-revalidate)
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {
              // Ignore network errors on background update
            });
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if valid response to cache
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache response for future offline visits
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // If offline and request is for a HTML page/document, return index.html (SPA fallback)
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
          });
      })
    );
  }
});
