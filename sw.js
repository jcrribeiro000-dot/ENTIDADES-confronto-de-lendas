const CACHE = 'entidades-v137';
const ASSETS = [
  './',
  './index.html',
  './entidades.js',
  './historia.js',
  './historia-progresso.js',
  './historia-atmosfera-herois.js',
  './historia-eventos.js',
  './historia-sistemas.js',
  './historia-combate.js',
  './historia-expedicoes.js',
  './nacoes.js',
  './conhecimento.js',
  './visual-stats-10x.js',
  './coop.js',
  './raid.js',
  './pvp.js',
  './historia-pa-morte.js',
  './raid-solo.js',
  './ui-confirm.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
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
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => cached))
  );
});