"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const CORNER_HEARTS = [
  "top-4 left-4 -rotate-12",
  "top-4 right-4 rotate-12",
  "bottom-24 left-4 rotate-6",
  "bottom-24 right-4 -rotate-6",
];

export function SpecialMessageScreen({
  body,
  onDone,
}: {
  body: string;
  onDone: () => void;
}) {
  return (
    <div className="lined-paper relative flex min-h-screen w-full flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      {CORNER_HEARTS.map((position, i) => (
        <Heart
          key={position}
          className={`absolute h-8 w-8 text-accent fill-accent/90 filter drop-shadow-sm ${position}`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-md whitespace-pre-wrap font-handwriting text-2xl leading-relaxed text-foreground sm:text-3xl"
      >
        {body}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <Button size="lg" onClick={onDone}>
          Continue
        </Button>
      </motion.div>
    </div>
  );
}
