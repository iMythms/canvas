// Generated build supplies an immutable app-shell version and its static import graph.
const CACHE = 'canvas-shell-__VERSION__';
const SHELL = __SHELL__;
const ROOT = new URL('./', self.location.href).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  // No skipWaiting: updates wait until existing app windows have closed.
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('canvas-shell-') && key !== CACHE)
    .map(key => caches.delete(key)))));
  // No claim/reload: never replace the code under an open editor.
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && url.pathname === '/') {
    // Pair the HTML with this worker's versioned assets, including while online.
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(ROOT)) || fetch(request)));
    return;
  }
  // Only known static directories; never cache workspace records or arbitrary URLs.
  if (!SHELL.includes(url.pathname) && !/^\/(assets|fonts)\//.test(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      // A quota failure must not turn a successful network response into a failed request.
      event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
    }
    return response;
  }));
});
