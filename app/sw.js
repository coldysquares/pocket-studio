// App shell: network first with a 3 second timeout, cache as fallback, so new deploys reach the phone
// and the app still opens offline or on weak signal.
// Offline pack (/vendor and /models): cache first. The page downloads it once into PACK, then it never needs the network.
const CACHE = 'pocketstudio-shell-v7';
const PACK = 'pocket-offline-pack-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './license.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png',
  './songbook/', './songbook/index.html', './songbook/styles.css', './songbook/web-polish.css', './songbook/pocket.css', './songbook/fonts.css',
  './songbook/main.js', './songbook/watch.js', './songbook/web-polish.js', './songbook/pocket.js',
  './songbook/fonts/anton-latin-400-normal.woff2', './songbook/fonts/silkscreen-latin-400-normal.woff2', './songbook/fonts/silkscreen-latin-700-normal.woff2',
  './songbook/fonts/ibm-plex-mono-latin-400-normal.woff2', './songbook/fonts/ibm-plex-mono-latin-400-italic.woff2', './songbook/fonts/ibm-plex-mono-latin-600-normal.woff2', './songbook/fonts/ibm-plex-mono-latin-700-normal.woff2'];
const isPack = url => /\/(vendor|models)\//.test(url.pathname);
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== PACK).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (isPack(url)) {
    e.respondWith(caches.open(PACK).then(async c => (await c.match(req.url)) || fetch(req)));
    return;
  }
  const net = fetch(req).then(res => {
    if (res.ok && res.type === 'basic') {
      const copy = res.clone();
      return caches.open(CACHE).then(c => c.put(req, copy)).then(() => res, () => res);
    }
    return res;
  });
  e.waitUntil(net.catch(() => {}));
  e.respondWith((async () => {
    const first = await Promise.race([net.catch(() => null), new Promise(r => setTimeout(r, 3000, null))]);
    if (first) return first;
    const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' }) || (req.mode === 'navigate' ? await caches.match('./index.html') : null);
    if (cached) return cached;
    try { return await net; } catch (err) { return Response.error(); }
  })());
});
