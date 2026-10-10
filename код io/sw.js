const CACHE_NAME = 'helper-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Установка — кешируем всё
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Активация — чистим старые кеши
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Перехват запросов — сначала кеш, потом сеть
self.addEventListener('fetch', (e) => {
  // API погоды и геолокации — всегда из сети
  if (e.request.url.includes('api.open-meteo.com') ||
      e.request.url.includes('ipapi.co')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      return (
        cached ||
        fetch(e.request).then((res) => {
          // Кешируем только GET-запросы
          if (e.request.method === 'GET' && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return res;
        })
      );
    }).catch(() => caches.match('./index.html'))
  );
});