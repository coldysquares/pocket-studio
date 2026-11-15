// Retired. The app now lives at /app/ with its own service worker.
// This only clears the old PocketMP3 shell cache and removes itself from phones that installed the earlier version.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('pocketmp3-shell')) await caches.delete(k);
    await self.registration.unregister();
  })());
});
