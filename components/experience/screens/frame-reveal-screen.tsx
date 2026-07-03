"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

const AUTO_ADVANCE_MS = 3200;

export function FrameRevealScreen({
  photoUrl,
  heading,
  onDone,
}: {
  photoUrl: string;
  heading: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Continue"
      className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-background px-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="gold-frame w-full max-w-[280px]"
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="torn-edge w-full max-w-xs bg-white px-6 py-5 shadow-lg"
      >
        <p className="text-center font-handwriting text-3xl text-primary sm:text-4xl">
          {heading}
        </p>
      </motion.div>
    </button>
  );
}
