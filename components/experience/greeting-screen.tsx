"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ScanLine, MessageCircleHeart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Logo } from "@/components/brand/logo";
import {
  cacheMediaForOrder,
  getCachedMedia,
  isCacheStorageSupported,
} from "@/lib/cache/media-cache";

const GENERIC_HEADING = "A Story For You";
const MAX_HEADING_LENGTH = 60;

function splitMessage(message: string) {
  const breakIndex = message.indexOf("\n");
  if (breakIndex === -1) {
    return message.length <= MAX_HEADING_LENGTH
      ? { heading: message, body: "" }
      : { heading: GENERIC_HEADING, body: message };
  }
  const firstLine = message.slice(0, breakIndex).trim();
  const rest = message.slice(breakIndex).trim();
  return firstLine.length > 0 && firstLine.length <= MAX_HEADING_LENGTH
    ? { heading: firstLine, body: rest }
    : { heading: GENERIC_HEADING, body: message };
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
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState(signedUrls.photo);
  const [messageOpen, setMessageOpen] = useState(false);
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

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-5 py-10 text-center sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="rounded-2xl border-[3px] border-accent/60 bg-white p-2 shadow-lg"
      >
        <div className="relative h-48 w-48 overflow-hidden rounded-xl border border-primary/20 sm:h-56 sm:w-56">
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Your photo" className="h-full w-full object-cover" />
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="mt-6"
      >
        <h1 className="font-serif text-2xl font-semibold text-primary sm:text-3xl">
          {heading}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your Special Digital Memory
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="mt-8 w-full max-w-sm space-y-3"
      >
        <button
          onClick={() => router.push(`/experience/${slug}/ar`)}
          className="flex w-full items-center gap-4 rounded-2xl bg-secondary px-5 py-4 text-left transition-transform active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
            <ScanLine className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wide text-primary">
              Launch AR Scan Portal
            </span>
          </span>
        </button>

        <button
          onClick={() => setMessageOpen(true)}
          className="flex w-full items-center gap-4 rounded-2xl bg-secondary px-5 py-4 text-left transition-transform active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
            <MessageCircleHeart className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wide text-primary">
              Our Special Message
            </span>
            <span className="block text-xs text-muted-foreground">From us, with love…</span>
          </span>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mt-10"
      >
        <Logo size="sm" />
      </motion.div>

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-primary">
              From us, with love…
            </DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-left text-sm leading-relaxed text-foreground">
            {body || message}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
