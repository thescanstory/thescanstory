"use client";

import { useEffect, useState } from "react";
import {
  cacheMediaForOrder,
  getCachedMedia,
  isCacheStorageSupported,
} from "@/lib/cache/media-cache";
import { splitMessage } from "@/lib/experience/split-message";
import { SinglePageStory } from "@/components/experience/single-page-story";

export function GreetingScreen({
  slug,
  orderId,
  message,
  cachedConfirmed,
  signedUrls,
}: {
  slug: string;
  orderId: string;
  message: string;
  cachedConfirmed: boolean;
  signedUrls: { photo: string; video: string; mind: string };
}) {
  const [photoUrl, setPhotoUrl] = useState(signedUrls.photo);
  const { heading, body } = splitMessage(message);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (isCacheStorageSupported()) {
        const cached = await getCachedMedia(orderId, "photo");
        if (cached && !cancelled) {
          setPhotoUrl(URL.createObjectURL(await cached.blob()));
        }
      }

      if (cachedConfirmed || !isCacheStorageSupported()) return;

      try {
        await cacheMediaForOrder(orderId, signedUrls);
        if (cancelled) return;
        const freshlyCached = await getCachedMedia(orderId, "photo");
        if (freshlyCached && !cancelled) {
          setPhotoUrl(URL.createObjectURL(await freshlyCached.blob()));
        }
        await fetch(`/api/experience/${slug}/confirm-cached`, { method: "POST" });
      } catch {
        // Caching failed silently
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, slug, cachedConfirmed]);

  return (
    <SinglePageStory
      slug={slug}
      heading={heading}
      body={body || message}
      photoUrl={photoUrl}
    />
  );
}
