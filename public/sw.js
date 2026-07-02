// Minimal service worker — registering it is what makes the Cache Storage
// API durable across tabs/reloads. The actual media caching logic lives in
// lib/cache/media-cache.ts, called directly from the page (simpler to
// await/report progress from React than round-tripping through
// postMessage with the SW's own fetch handler).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
