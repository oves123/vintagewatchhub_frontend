const CACHE_NAME = "wch-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
];

const API_CACHE = "wch-api-v1";
const API_CACHE_TTL = 5 * 60 * 1000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cache API GET responses
  if (url.pathname.startsWith("/api/") || url.hostname !== self.location.hostname) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              cache.put(request, clone);
            }
            return response;
          })
          .catch(() => cache.match(request))
      )
    );
    return;
  }

  // Cache static assets (network-first, fallback to cache)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      fetch(request)
        .then((response) => {
          cache.put(request, response.clone());
          return response;
        })
        .catch(() => cache.match(request).then((cached) => cached || new Response("Offline", { status: 503 })))
    )
  );
});
