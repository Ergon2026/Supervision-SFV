// Service Worker — Supervisión SFV Campo
// Cachea el aplicativo completo (incluida la librería SheetJS) para que funcione
// sin señal ni datos móviles una vez instalado/abierto la primera vez.

// IMPORTANTE: subir este número en TODA entrega nueva, aunque el cambio
// real haya sido solo en index.html. El navegador solo detecta que hay
// una versión nueva del Service Worker comparando este archivo byte por
// byte — si sw.js queda idéntico, nunca se entera de que index.html
// cambió, y sigue sirviendo la copia vieja desde caché indefinidamente.
const CACHE_NAME = 'supervision-sfv-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './vendor/xlsx.full.min.js',
  './vendor/jszip.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia: cache-first para todo lo del propio app (funciona sin red).
// Para llamadas de sincronización (POST al backend) el propio JS de la app
// ya maneja la lógica de reintento; el SW no intercepta peticiones POST.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          return response;
        })
        .catch(() => cached);
    })
  );
});
