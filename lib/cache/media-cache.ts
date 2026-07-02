const CACHE_NAME = "scan-story-media-v1";

export type CachedMediaType = "photo" | "video" | "mind";

// Stable key, NOT the raw signed URL — signed URLs carry rotating
// query-string tokens, so caching against the literal URL would defeat
// repeat-visit lookups.
function keyFor(orderId: string, type: CachedMediaType) {
  return `/scan-story-media/${orderId}/${type}`;
}

export function isCacheStorageSupported() {
  return typeof window !== "undefined" && "caches" in window;
}

export async function cacheMediaForOrder(
  orderId: string,
  urls: { photo: string; video: string; mind: string }
) {
  const cache = await caches.open(CACHE_NAME);

  await Promise.all(
    (Object.entries(urls) as [CachedMediaType, string][]).map(
      async ([type, url]) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type} for caching`);
        }
        await cache.put(new Request(keyFor(orderId, type)), response.clone());
      }
    )
  );
}

export async function getCachedMedia(orderId: string, type: CachedMediaType) {
  if (!isCacheStorageSupported()) return undefined;
  const cache = await caches.open(CACHE_NAME);
  return cache.match(keyFor(orderId, type));
}
