"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gamepad2, MessageCircleHeart, ScanLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Logo } from "@/components/brand/logo";

export function MenuScreen({
  slug,
  heading,
  body,
  message,
  photoUrl,
}: {
  slug: string;
  heading: string;
  body: string;
  message: string;
  photoUrl: string;
}) {
  const router = useRouter();
  const [messageOpen, setMessageOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-5 py-10 text-center sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="gold-frame w-48 sm:w-56"
      >
        <div className="gold-frame-mat">
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Your photo" className="h-full w-full object-cover" />
            )}
          </div>
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

        <button
          onClick={() => router.push(`/experience/${slug}/game`)}
          className="flex w-full items-center gap-4 rounded-2xl bg-secondary px-5 py-4 text-left transition-transform active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wide text-primary">
              Play &quot;Catch the Heart&quot;
            </span>
            <span className="block text-xs text-muted-foreground">A tiny game, just for you</span>
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
          <p className="whitespace-pre-wrap text-left font-handwriting text-2xl leading-relaxed text-foreground">
            {body || message}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
