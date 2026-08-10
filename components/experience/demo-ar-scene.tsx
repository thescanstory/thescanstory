"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Play, RotateCcw, ScanLine } from "lucide-react";
import type { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import { Logo } from "@/components/brand/logo";

type Status =
  | "idle"
  | "starting"
  | "scanning"
  | "found"
  | "revealing"
  | "video"
  | "permission-denied"
  | "camera-not-found"
  | "error";

// Camera shows the matched target for 3s, then blurs into the video.
const REVEAL_DELAY_MS = 3000;
const BLUR_TRANSITION_MS = 900;

export function DemoARScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mindarRef = useRef<MindARThree | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(REVEAL_DELAY_MS / 1000);
  const [videoEnded, setVideoEnded] = useState(false);

  // Minimal console-only logger (for diagnostics)
  const log = useCallback((msg: string) => {
    console.log("[DemoARScene]", msg);
  }, []);

  const clearRevealTimers = useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Keep the camera + aligned box on screen for 3s, then blur into the video.
  const startRevealSequence = useCallback(() => {
    clearRevealTimers();
    setCountdown(REVEAL_DELAY_MS / 1000);
    setStatus("found");
    setVideoEnded(false);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        const next = Math.max(0, c - 1);
        if (next === 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        return next;
      });
    }, 1000);

    revealTimerRef.current = setTimeout(() => {
      setStatus("revealing"); // CSS blurs the camera here
      revealTimerRef.current = setTimeout(() => {
        setStatus("video"); // swap to full-screen video
        revealTimerRef.current = null;
      }, BLUR_TRANSITION_MS);
    }, REVEAL_DELAY_MS);
  }, [clearRevealTimers]);

  const resetToIdle = useCallback(() => {
    clearRevealTimers();
    setVideoEnded(false);
    setStatus("idle");
    try {
      mindarRef.current?.stop();
    } catch {
      /* ignore */
    }
    if (containerRef.current) containerRef.current.innerHTML = "";
    mindarRef.current = null;
  }, [clearRevealTimers]);

  const startAR = useCallback(async () => {
    if (!containerRef.current) return;
    clearRevealTimers();
    setVideoEnded(false);
    setStatus("starting");
    setErrorMessage(null);
    setCameras([]);
    log("AR starting...");

    try {
      if (mindarRef.current) {
        log("Stopping previous instance...");
        try {
          mindarRef.current.stop();
        } catch {
          log("Error calling stop()");
        }
        const { renderer } = mindarRef.current;
        if (renderer) renderer.setAnimationLoop(null);
        if (containerRef.current) containerRef.current.innerHTML = "";
      }
    } catch {
      log("Error cleaning up previous instance");
    }

    try {
      // Step 1: WebGL Check
      let gl: WebGLRenderingContext | null = null;
      try {
        gl =
          document.createElement("canvas").getContext("webgl", {
            failIfMajorPerformanceCaveat: true,
          }) ||
          (document.createElement("canvas").getContext("webgl2") as WebGLRenderingContext | null);
      } catch {
        gl = null;
      }
      if (!gl) {
        throw new Error("WebGL not available. Please enable hardware acceleration in your browser.");
      }
      console.log("[DemoARScene] Step 1/4: WebGL OK");
      log("Step 1/4: WebGL OK");

      // Step 2: Device Enumeration
      let foundCameras: string[] = [];
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        foundCameras = devices
          .filter(d => d.kind === "videoinput")
          .map(d => d.label || `Unknown Camera (${d.deviceId.slice(0, 5)})`);
        setCameras(foundCameras);
        log(`Cameras found: ${foundCameras.length}`);
      } catch {
        log("Could not enumerate devices");
      }

      const { MindARThree } = await import("mind-ar/dist/mindar-image-three.prod.js");
      log("Step 2/4: MindAR module loaded");

      const mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "/targets.mind",
        // Smooth the tracking pose to reduce shaking/wobble. MindAR's default
        // filterBeta (1000) amplifies tiny tracking noise; lowering it keeps
        // the One-Euro cutoff near its minimum so the overlay sits steady.
        filterMinCF: 0.001,
        filterBeta: 0,
      });
      mindarRef.current = mindarThree;

      const { renderer, scene, camera } = mindarThree;
      log("Step 3/4: MindARThree constructed");

      // ADDED: Log target loading
      log("Attempting to load targets from: /targets.mind");

      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);
      // In MindAR anchor space, 1 unit = the target image's width/height.
      // A 1x1x1 box therefore exactly covers (and aligns with) the target's
      // on-screen footprint, tracking it as the camera moves.
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      });
      const box = new THREE.Mesh(geometry, material);
      const anchor = mindarThree.addAnchor(0);
      anchor.group.add(box);

      // ADDED: Verbose tracking logs
      anchor.onTargetFound = () => {
        log(">>> TRACKING: Target found!");
        startRevealSequence();
      };
      anchor.onTargetLost = () => {
        log(">>> TRACKING: Target lost.");
        setStatus((s) => (s === "video" || s === "revealing" ? s : "scanning"));
        clearRevealTimers();
      };

      log("Step 4/4: calling mindarThree.start()...");
      await mindarThree.start();
      renderer.setAnimationLoop(() => renderer.render(scene, camera));
      log("MindAR started — scanning...");
      setStatus("scanning");
    } catch (err) {
      log("INIT FAILED: " + (err instanceof Error ? err.message : String(err)));
      
      let message = "";
      if (err instanceof Error) {
        message = err.message || err.name;
      } else if (typeof err === "string") {
        message = err;
      } else if (err && typeof err === "object") {
        const obj = err as { message?: string; name?: string; code?: string };
        message = obj.message || obj.name || obj.code || JSON.stringify(err);
      }

      if (!message) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(t => t.stop());
          message = "Initialization failed (camera is accessible but MindAR could not start).";
        } catch (camErr) {
          const errObj = camErr as { message?: string; name?: string };
          message = errObj.message || errObj.name || "Camera access failed";
        }
      }

      const lower = message.toLowerCase();
      if (lower.includes("permission") || lower.includes("notallowed")) {
        setStatus("permission-denied");
      } else if (lower.includes("notfound") || lower.includes("device") || lower.includes("readable")) {
        setStatus("camera-not-found");
        setErrorMessage(message);
      } else {
        setStatus("error");
        setErrorMessage(message);
      }
    }
  }, [log, startRevealSequence, clearRevealTimers]);

  // Autoplay the video once we transition to the video screen.
  useEffect(() => {
    if (status === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked until a user gesture — the inline
        // controls let them start it manually.
      });
    }
  }, [status]);

  useEffect(() => {
    return () => {
      clearRevealTimers();
      mindarRef.current?.stop();
    };
  }, [clearRevealTimers]);

  const isOverlayVisible =
    status !== "scanning" &&
    status !== "found" &&
    status !== "revealing" &&
    status !== "video";

  const progressPct = (countdown / (REVEAL_DELAY_MS / 1000)) * 100;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* MindAR renders the live camera + aligned box here */}
      <div
        ref={containerRef}
        className={
          "absolute inset-0 transition-[filter,transform] duration-700 ease-in-out " +
          (status === "revealing" ? "scale-110 blur-2xl" : "scale-100 blur-0")
        }
      />

      {/* Fade veil that smooths the hand-off into the video */}
      <div
        className={
          "pointer-events-none absolute inset-0 z-[8] bg-black transition-opacity duration-700 " +
          (status === "revealing" ? "opacity-90" : "opacity-0")
        }
      />

      {/* ── Scanning overlay ──────────────────────────────────────────── */}
      {status === "scanning" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
          <div className="relative flex h-44 w-44 items-center justify-center">
            <span className="absolute left-0 top-0 h-9 w-9 border-l-2 border-t-2 border-accent/80 rounded-tl animate-pulse" />
            <span className="absolute right-0 top-0 h-9 w-9 border-r-2 border-t-2 border-accent/80 rounded-tr animate-pulse" />
            <span className="absolute bottom-0 left-0 h-9 w-9 border-b-2 border-l-2 border-accent/80 rounded-bl animate-pulse" />
            <span className="absolute bottom-0 right-0 h-9 w-9 border-b-2 border-r-2 border-accent/80 rounded-br animate-pulse" />
            <ScanLine className="h-12 w-12 text-white/50" />
          </div>
          <p className="mt-6 text-sm text-white/80">Point camera at the target image…</p>
        </div>
      )}

      {/* ── Found: countdown before blurring into the video ───────────── */}
      {status === "found" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-end pb-16">
          <div className="rounded-2xl bg-black/55 px-6 py-4 text-center backdrop-blur">
            <p className="text-sm font-medium text-white/90">Target matched 🎯</p>
            <p className="mt-1 text-xs text-white/60">Unlocking your memory in…</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="font-serif text-3xl font-semibold text-accent">
                {countdown}
              </span>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen video player ──────────────────────────────────── */}
      {status === "video" && (
        <div className="absolute inset-0 z-10 flex flex-col bg-black">
          <video
            ref={videoRef}
            src="/demo-video.mp4"
            controls={videoEnded}
            autoPlay
            playsInline
            onEnded={() => setVideoEnded(true)}
            className="h-full w-full bg-black object-contain"
          />

          {/* Tap overlay if autoplay was blocked */}
          {!videoEnded && (
            <button
              type="button"
              onClick={() => {
                videoRef.current?.play();
                setVideoEnded(false);
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
              aria-label="Play video"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black">
                <Play className="ml-1 h-7 w-7" />
              </span>
            </button>
          )}

          <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-3">
            <button
              onClick={() => {
                videoRef.current?.play();
                setVideoEnded(false);
              }}
              className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-2.5 text-sm font-semibold text-black shadow-lg active:scale-95"
            >
              <RotateCcw className="h-4 w-4" /> Replay
            </button>
            <button
              onClick={resetToIdle}
              className="flex items-center gap-2 rounded-full bg-black/60 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur active:scale-95"
            >
              <ScanLine className="h-4 w-4" /> Scan again
            </button>
          </div>
        </div>
      )}

      {/* ── Full-screen overlay (idle / starting / errors) ─────────────── */}
      {isOverlayVisible && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
          {status === "idle" && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <Logo size="lg" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7 }}
                className="relative flex h-44 w-44 items-center justify-center"
              >
                <span className="absolute left-0 top-0 h-9 w-9 border-l-2 border-t-2 border-white/40 rounded-tl" />
                <span className="absolute right-0 top-0 h-9 w-9 border-r-2 border-t-2 border-white/40 rounded-tr" />
                <span className="absolute bottom-0 left-0 h-9 w-9 border-b-2 border-l-2 border-white/40 rounded-bl" />
                <span className="absolute bottom-0 right-0 h-9 w-9 border-b-2 border-r-2 border-white/40 rounded-br" />
                <ScanLine className="h-12 w-12 text-white/40" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="space-y-2 max-w-xs"
              >
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-accent">
                  Scan · Reveal · Relive
                </p>
                <p className="text-sm text-white/60 leading-relaxed">
                  Point your camera at the printed photo. When it locks on, the
                  frame fills with color — then watch your memory come alive.
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.7 }}
                onClick={startAR}
                className="rounded-full bg-accent px-10 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Start AR
              </motion.button>
            </>
          )}

          {status === "starting" && (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <p className="text-sm text-white/70">Opening camera…</p>
            </div>
          )}

          {status === "permission-denied" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Camera access was denied. Please allow camera access in your
                browser settings, then try again.
              </p>
              <button
                onClick={startAR}
                className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Try again
              </button>
            </>
          )}

          {status === "camera-not-found" && (
            <>
              <div className="space-y-4 max-w-xs">
                <p className="text-sm text-white/70">
                  We couldn&apos;t find a suitable camera. This often happens on
                  desktops without a webcam or when another app is using the camera.
                </p>
                {cameras.length > 0 && (
                  <div className="rounded bg-white/10 p-3 text-left">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Detected Cameras:
                    </p>
                    <ul className="list-inside list-disc text-xs text-white/60">
                      {cameras.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[10px] text-white/40 italic">
                  Error: {errorMessage}
                </p>
              </div>
              <button
                onClick={startAR}
                className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Try again
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Something went wrong starting the camera
                {errorMessage ? `: ${errorMessage}` : ""}.
              </p>
              <button
                onClick={startAR}
                className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Try again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

