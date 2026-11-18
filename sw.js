// iRob offline support: the app opens even with no signal.
// Pages/scripts: network first (so updates arrive right away), cached copy when offline.
// Fonts/images: cache first. Never caches AI, photos from other sites, or anything that isn't a plain GET.
const CACHE = 'irob-v20';
const SHELL = ['./', './index.html', './cards.js', './cards.css', './life.js', './fun.js', './fun.css', './music.js', './cat.js', './rob.jpg', './icon-180.png?v=2', './favicon-32.png?v=2',
  './fonts/cinzel-latin.woff2', './fonts/lora-400-latin.woff2', './fonts/lora-italic-400-latin.woff2', './fonts/cormorant-600-latin.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(new URL('./', location.href).pathname)) return;
  if (url.pathname.endsWith('letters.json')) return;                       // always fresh
  const isAsset = /\.(woff2|png|jpe?g|svg|ico)$/i.test(url.pathname);
  if (isAsset){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone())); return res; })));
    return;
  }
  e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req, {ignoreSearch:true}).then(hit => hit || caches.match('./index.html'))));
});
