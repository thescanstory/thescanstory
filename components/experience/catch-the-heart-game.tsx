"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const GAME_DURATION_MS = 30_000;
const SPAWN_INTERVAL_MS = 650;
const HEART_COLORS = ["#c2185b", "#e0508a", "#f2a4c1", "#b8860b"];

type FallingHeart = {
  id: number;
  x: number;
  y: number;
  speed: number;
  radius: number;
  color: string;
  rotation: number;
};

type GameState = "ready" | "playing" | "ended";

function highScoreKey(slug: string) {
  return `scan-story-heart-high-score-${slug}`;
}

// Canvas-driven so the falling-hearts animation stays smooth at 60fps
// without triggering React re-renders per frame — game state (hearts,
// timers) lives in refs; React state only drives the score/timer/overlay
// UI around the canvas.
export function CatchTheHeartGame({ slug }: { slug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartsRef = useRef<FallingHeart[]>([]);
  const nextIdRef = useRef(0);
  const rafRef = useRef<number>();
  const lastSpawnRef = useRef(0);
  const lastFrameRef = useRef(0);
  const endAtRef = useRef(0);
  const scoreRef = useRef(0);

  const [gameState, setGameState] = useState<GameState>("ready");
  const [score, setScore] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(GAME_DURATION_MS);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const stored = Number(localStorage.getItem(highScoreKey(slug)) ?? 0);
    if (Number.isFinite(stored)) setHighScore(stored);
  }, [slug]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const drawHeart = useCallback(
    (ctx: CanvasRenderingContext2D, heart: FallingHeart) => {
      ctx.save();
      ctx.translate(heart.x, heart.y);
      ctx.rotate(heart.rotation);
      ctx.fillStyle = heart.color;
      const s = heart.radius;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(-s, -s * 0.6, -s * 1.8, s * 0.5, 0, s * 1.4);
      ctx.bezierCurveTo(s * 1.8, s * 0.5, s, -s * 0.6, 0, s * 0.35);
      ctx.fill();
      ctx.restore();
    },
    []
  );

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const endGame = useCallback(() => {
    stopLoop();
    setGameState("ended");
    setHighScore((prev) => {
      const next = Math.max(prev, scoreRef.current);
      localStorage.setItem(highScoreKey(slug), String(next));
      return next;
    });
  }, [slug, stopLoop]);

  const tick = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const dt = lastFrameRef.current ? now - lastFrameRef.current : 16;
      lastFrameRef.current = now;

      if (now - lastSpawnRef.current > SPAWN_INTERVAL_MS) {
        lastSpawnRef.current = now;
        heartsRef.current.push({
          id: nextIdRef.current++,
          x: 24 + Math.random() * (width - 48),
          y: -30,
          speed: 0.09 + Math.random() * 0.06,
          radius: 16 + Math.random() * 10,
          color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
          rotation: (Math.random() - 0.5) * 0.6,
        });
      }

      heartsRef.current = heartsRef.current.filter((h) => {
        h.y += h.speed * dt;
        return h.y < height + 40;
      });

      ctx.clearRect(0, 0, width, height);
      for (const heart of heartsRef.current) drawHeart(ctx, heart);

      const remaining = Math.max(0, endAtRef.current - now);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        endGame();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [drawHeart, endGame]
  );

  const startGame = useCallback(() => {
    heartsRef.current = [];
    scoreRef.current = 0;
    lastSpawnRef.current = 0;
    lastFrameRef.current = 0;
    endAtRef.current = performance.now() + GAME_DURATION_MS;
    setScore(0);
    setTimeLeftMs(GAME_DURATION_MS);
    setGameState("playing");
    resizeCanvas();
    rafRef.current = requestAnimationFrame(tick);
  }, [resizeCanvas, tick]);

  useEffect(() => stopLoop, [stopLoop]);

  function handlePointer(e: React.PointerEvent<HTMLCanvasElement>) {
    if (gameState !== "playing") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = heartsRef.current.find((h) => {
      const dx = h.x - x;
      const dy = h.y - y;
      return Math.sqrt(dx * dx + dy * dy) < h.radius + 14;
    });
    if (hit) {
      heartsRef.current = heartsRef.current.filter((h) => h.id !== hit.id);
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-secondary/60 to-background">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointer}
        className="absolute inset-0 touch-none"
      />

      <Link
        href={`/experience/${slug}`}
        className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-primary shadow-sm backdrop-blur"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      {gameState === "playing" && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex items-center justify-center gap-6 text-sm font-semibold uppercase tracking-wide text-primary">
          <span>Score: {score}</span>
          <span>{Math.ceil(timeLeftMs / 1000)}s</span>
        </div>
      )}

      {gameState === "ready" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <Heart className="h-10 w-10 text-primary" fill="currentColor" />
          <h1 className="font-serif text-2xl font-semibold text-primary">
            Catch the Heart
          </h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Tap the falling hearts before they reach the bottom. You&apos;ve
            got {GAME_DURATION_MS / 1000} seconds.
          </p>
          {highScore > 0 && (
            <p className="text-xs text-muted-foreground">Best score: {highScore}</p>
          )}
          <Button size="lg" onClick={startGame}>
            Start
          </Button>
        </div>
      )}

      {gameState === "ended" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background/90 px-8 text-center backdrop-blur">
          <Heart className="h-10 w-10 text-primary" fill="currentColor" />
          <h1 className="font-serif text-2xl font-semibold text-primary">
            Time&apos;s up!
          </h1>
          <p className="gradient-text text-4xl font-bold">{score}</p>
          <p className="text-sm text-muted-foreground">
            Best score: {highScore}
          </p>
          <div className="mt-2 flex gap-3">
            <Button size="lg" onClick={startGame}>
              Play again
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={`/experience/${slug}`}>Back to menu</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
