const CACHE_NAME = 'ubuntu-assets';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Ignore chrome-extension:// and other non-http/https requests
  if (!event.request.url.startsWith('http')) return;

  // Strip Vite's cache-busting parameters ?t= and ?v= to match cached files, but keep ?import
  const url = new URL(event.request.url);
  url.searchParams.delete('t');
  url.searchParams.delete('v');
  const cacheRequest = new Request(url.toString(), event.request);

  event.respondWith(
    caches.match(cacheRequest).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((networkResponse) => {
        // Cache successful GET requests dynamically
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(cacheRequest, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.error('[Service Worker] Fetch failed:', err);
        return Response.error();
      });
    })
  );
});
