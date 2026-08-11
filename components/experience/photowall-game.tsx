"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type Tile = {
  id: number;
  revealed: boolean;
};

export function PhotowallGame({
  slug,
  photoUrl,
  heading,
}: {
  slug: string;
  photoUrl: string;
  heading: string;
}) {
  const gridRows = 4;
  const gridCols = 3;
  const totalTiles = gridRows * gridCols;

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [revealCount, setRevealCount] = useState(0);

  useEffect(() => {
    const initialTiles = Array.from({ length: totalTiles }, (_, i) => ({
      id: i,
      revealed: false,
    }));
    setTiles(initialTiles);
    setIsCompleted(false);
    setRevealCount(0);
  }, [totalTiles]);

  const handleTileClick = (id: number) => {
    if (isCompleted) return;

    setTiles((prev) =>
      prev.map((t) => {
        if (t.id === id && !t.revealed) {
          const nextRevealed = true;
          return { ...t, revealed: nextRevealed };
        }
        return t;
      })
    );
  };

  // Monitor completions
  useEffect(() => {
    if (tiles.length === 0) return;
    const revealedCount = tiles.filter((t) => t.revealed).length;
    setRevealCount(revealedCount);

    if (revealedCount === totalTiles) {
      setIsCompleted(true);
    }
  }, [tiles, totalTiles]);

  const resetGame = () => {
    setTiles((prev) => prev.map((t) => ({ ...t, revealed: false })));
    setIsCompleted(false);
    setRevealCount(0);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center bg-background px-5 py-6 text-center">
      {/* Header / Back */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <Link
          href={`/experience/${slug}/story`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-primary shadow-sm backdrop-blur active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Reveal Progress: {revealCount} / {totalTiles}
        </span>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <h1 className="font-serif text-2xl font-semibold text-primary mb-1">
        Tap-to-Reveal Photowall
      </h1>
      <p className="text-xs text-muted-foreground max-w-xs mb-6">
        Tap the tiles to reveal the hidden photo behind them!
      </p>

      {/* Main Grid Wrapper */}
      <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-muted">
        {/* Underlay: The full photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt="Hidden memories"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay Grid of Tiles */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-[2px] p-[2px] bg-white/20">
          {tiles.map((tile) => (
            <div key={tile.id} className="relative w-full h-full overflow-hidden">
              <AnimatePresence>
                {!tile.revealed && (
                  <motion.button
                    onClick={() => handleTileClick(tile.id)}
                    initial={{ opacity: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      rotateY: 90,
                      transition: { duration: 0.4 },
                    }}
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-accent via-secondary to-accent flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
                  >
                    <Heart
                      className="h-5 w-5 text-white/40 fill-white/10"
                      strokeWidth={1.5}
                    />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Success Overlay */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-4 text-white p-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg"
              >
                <Sparkles className="h-8 w-8" />
              </motion.div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold">Beautiful Memories!</h3>
                <p className="text-xs text-white/80 max-w-xs leading-relaxed">
                  You revealed the special photo of {heading}!
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={resetGame}
                  className="rounded-full bg-white text-primary font-semibold hover:bg-white/95"
                >
                  Play Again
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="rounded-full bg-accent text-white font-semibold hover:bg-accent/95"
                >
                  <Link href={`/experience/${slug}/story`}>Menu</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-muted-foreground flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-widest font-semibold">
          The Scan Story
        </span>
      </div>
    </div>
  );
}
