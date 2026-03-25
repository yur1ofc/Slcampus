const CACHE_NAME = 'slc-static-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './utils.js',
  './firebase-config.js',
  './auth.js',
  './database.js',
  './daily-log.js',
  './class-diary.js',
  './review-system.js',
  './grade-calculator.js',
  './smart-dashboard.js',
  './ai-assistant.js',
  './schedule.js',
  './views.js',
  './app.js',
  './script.js',
  './setup-onboarding-enhancer.js',
  './app-enhancements.js',
  './manifest.json',
  './favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned)).catch(() => null);
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
  );
});
