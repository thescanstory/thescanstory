"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";

const AUTO_ADVANCE_MS = 2400;

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Continue"
      className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Logo size="lg" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground"
      >
        Presents
      </motion.p>
    </button>
  );
}
