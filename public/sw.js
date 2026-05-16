// VittaSys Service Worker — Cache mínimo para instalação PWA
const CACHE = 'vittasys-v1';
const STATIC = ['/','index.html','/css/main.css','/css/mobile.css','/assets/logos/logo-icon-color.png','/assets/logos/logo-vertical-color.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

// Network first — sempre busca do servidor, cache só como fallback
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('/api/')) return; // API nunca do cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
