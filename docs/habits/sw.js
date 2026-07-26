/* Minimal offline service worker for the Reward Habits PWA.
   Network-first so updates arrive when online, with a cache fallback so the app
   keeps working with no connection. The app itself is a single self-contained
   file, so caching the shell + icons is enough. */
const CACHE_PREFIX = 'reward-habits-';
const CACHE = CACHE_PREFIX + 'v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  // Only clear THIS app's older caches. Another PWA is hosted at the origin
  // root, and deleting every cache here would wipe its offline copy (and vice
  // versa), so each app must stay inside its own cache namespace.
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))),
  );
});
