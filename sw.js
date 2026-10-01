// Service Worker de EvaLuPa — necesario para que la app se pueda "instalar"
// de verdad en Android/Chrome (icono completo, sin insignia de Chrome, modo
// standalone sin barra de direcciones).
//
// Estrategia: red primero, caché como respaldo offline. Así siempre se sirve
// la versión más reciente de index.html cuando hay conexión, y solo se usa
// la copia en caché si el dispositivo está sin internet.

const CACHE = 'evalupa-cache-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Solo cachear peticiones GET de la propia app (nunca Google Drive, APIs, etc.)
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (resp && resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copia));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
