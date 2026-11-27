const CACHE_NAME = "odabnote-shell-v20261127font2";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/styles.css?v=20261127font2",
  "/app.js?v=20261125pay",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.png",
  "/modules/storage.js",
  "/modules/sampleImages.js",
  "/modules/i18n.js",
  "/modules/magicEraser.js",
  "/modules/trialLicense.js",
  "/modules/playBilling.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first with cache fallback so updates arrive immediately while offline still works.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
