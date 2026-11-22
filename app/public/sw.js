// Pages (index.html) are network-first so updates show up; hashed assets + Google Fonts are cache-first for offline use.
const CACHE = 'strasse-v3';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './manifest.webmanifest', './icon-192.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
const save = (req, res) => { if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || (url.origin !== location.origin && !FONT_HOSTS.includes(url.hostname))) return;
  if (e.request.mode === 'navigate') {
    // no-cache: revalidate with the server (GitHub Pages sends max-age=600), so a fresh deploy shows on next open
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((res) => save('./', res)).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => save(e.request, res))));
});
