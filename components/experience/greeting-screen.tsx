"use client";

import { useEffect, useRef, useState } from "react";
import {
  cacheMediaForOrder,
  getCachedMedia,
  isCacheStorageSupported,
} from "@/lib/cache/media-cache";
import { splitMessage } from "@/lib/experience/split-message";
import { SplashScreen } from "@/components/experience/screens/splash-screen";
import { FrameRevealScreen } from "@/components/experience/screens/frame-reveal-screen";
import { SpecialMessageScreen } from "@/components/experience/screens/special-message-screen";
import { MenuScreen } from "@/components/experience/screens/menu-screen";

type Screen = "splash" | "frame" | "message" | "menu";

function visitedKey(slug: string) {
  return `scan-story-visited-${slug}`;
}

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
  const [screen, setScreen] = useState<Screen | null>(null);
  const { heading, body } = splitMessage(message);

  // First-ever open plays the full splash -> frame -> message -> menu
  // sequence; every open after that (revisiting the link) lands straight on
  // the menu. Marked visited immediately so a reload mid-sequence doesn't
  // replay it from the top.
  //
  // Guarded with a ref because this effect is not idempotent (it writes to
  // localStorage) and React 18 Strict Mode double-invokes effects in dev —
  // without the guard, the second invocation reads back the first
  // invocation's own write and misreads a brand-new visit as a returning
  // one, skipping the intro entirely.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const key = visitedKey(slug);
    if (localStorage.getItem(key)) {
      setScreen("menu");
    } else {
      localStorage.setItem(key, "1");
      setScreen("splash");
    }
  }, [slug]);

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
        // Must swap to the freshly-cached blob URL before confirming —
        // confirm-cached deletes the server-side file once it's called, so
        // the signed URL still in `photoUrl` would otherwise start 404ing
        // out from under the displayed image the moment this resolves.
        const freshlyCached = await getCachedMedia(orderId, "photo");
        if (freshlyCached && !cancelled) {
          setPhotoUrl(URL.createObjectURL(await freshlyCached.blob()));
        }
        await fetch(`/api/experience/${slug}/confirm-cached`, { method: "POST" });
      } catch {
        // Caching failed (old browser, storage quota, etc.) — leave the
        // server files in place and let Screen 2 fall back to network
        // fetch. Never block the greeting UX on this.
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, slug, cachedConfirmed]);

  if (screen === null) {
    // Deciding which screen to open on (localStorage read) — a blank
    // background frame avoids flashing the wrong screen before it resolves.
    return <div className="min-h-screen w-full bg-background" />;
  }

  if (screen === "splash") {
    return <SplashScreen onDone={() => setScreen("frame")} />;
  }

  if (screen === "frame") {
    return (
      <FrameRevealScreen
        photoUrl={photoUrl}
        heading={heading}
        onDone={() => setScreen("message")}
      />
    );
  }

  if (screen === "message") {
    return (
      <SpecialMessageScreen body={body || message} onDone={() => setScreen("menu")} />
    );
  }

  return (
    <MenuScreen
      slug={slug}
      heading={heading}
      body={body}
      message={message}
      photoUrl={photoUrl}
    />
  );
}
