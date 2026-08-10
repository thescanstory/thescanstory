"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ScanLine, Volume2 } from "lucide-react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { getCachedMedia } from "@/lib/cache/media-cache";
import { createFrameMatte } from "@/lib/ar/frame-matte";
import type { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

type Status =
  | "welcome"      // pre-launch: camera not open, welcome message shown
  | "starting"     // MindAR initialising / camera permission requested
  | "scanning"     // camera live, waiting for target
  | "target-found" // target in frame — "Play Video" button shown
  | "playing"      // video is playing over the target
  | "permission-denied"
  | "error";

async function resolveMediaUrl(
  orderId: string,
  type: "photo" | "video" | "mind",
  fallbackUrl: string
) {
  const cached = await getCachedMedia(orderId, type);
  if (cached) {
    const blob = await cached.blob();
    return URL.createObjectURL(blob);
  }
  return fallbackUrl;
}

async function getImageAspectRatio(url: string) {
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img.naturalHeight / img.naturalWidth || 1;
  } catch {
    return 1;
  }
}

// Must never hang — falls back to 1:1 rather than stall the camera open.
function getVideoDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    let settled = false;
    const settle = (dims: { width: number; height: number }) => {
      if (settled) return;
      settled = true;
      resolve(dims);
    };
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;
    video.onloadedmetadata = () =>
      settle({ width: video.videoWidth || 1, height: video.videoHeight || 1 });
    video.onerror = () => settle({ width: 1, height: 1 });
    setTimeout(() => settle({ width: 1, height: 1 }), 3000);
  });
}

function applyCoverCrop(
  texture: THREE.VideoTexture,
  planeAspectRatio: number,
  videoAspectRatio: number
) {
  if (videoAspectRatio > planeAspectRatio) {
    texture.repeat.set(planeAspectRatio / videoAspectRatio, 1);
    texture.offset.set((1 - texture.repeat.x) / 2, 0);
  } else {
    texture.repeat.set(1, videoAspectRatio / planeAspectRatio);
    texture.offset.set(0, (1 - texture.repeat.y) / 2);
  }
}

export function ARScene({
  orderId,
  slug,
  signedUrls,
  welcomeMessage,
}: {
  orderId: string;
  slug: string;
  signedUrls: { photo: string; video: string; mind: string };
  /** Optional greeting shown on the pre-launch welcome card */
  welcomeMessage?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindarRef = useRef<MindARThree | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<Status>("welcome");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── launch MindAR (called from the "Start AR" button) ─────────────────
  const startAR = useCallback(async () => {
    if (!containerRef.current) return;
    setStatus("starting");
    setErrorMessage(null);

    try {
      const [mindUrl, videoUrl, photoUrl] = await Promise.all([
        resolveMediaUrl(orderId, "mind", signedUrls.mind),
        resolveMediaUrl(orderId, "video", signedUrls.video),
        resolveMediaUrl(orderId, "photo", signedUrls.photo),
      ]);

      const { MindARThree } = await import(
        "mind-ar/dist/mindar-image-three.prod.js"
      );

      const mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: mindUrl,
      });
      mindarRef.current = mindarThree;
      const { renderer, scene, camera } = mindarThree;

      const video = document.createElement("video");
      video.src = videoUrl;
      video.loop = true;
            // Muted so iOS allows inline autoplay the moment the target locks;
      // tap the on-screen Sound button to unmute (gesture-backed).
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      videoElRef.current = video;

      const [aspect, videoDimensions] = await Promise.all([
        getImageAspectRatio(photoUrl),
        getVideoDimensions(videoUrl),
      ]);

      const videoTexture = new THREE.VideoTexture(video);
      applyCoverCrop(
        videoTexture,
        1 / aspect,
        videoDimensions.width / videoDimensions.height
      );
      const geometry = new THREE.PlaneGeometry(1, aspect);
      const material = new THREE.MeshBasicMaterial({ map: videoTexture });
            const plane = new THREE.Mesh(geometry, material);
      plane.visible = false;
      // Visible picture-frame matte "set up" around the video so playback is
      // clearly framed on the printed photo. Sits just behind the video plane.
      const frameMatte = createFrameMatte(1, aspect, { borderWorld: 0.1 });
      frameMatte.visible = false;

      const anchor = mindarThree.addAnchor(0);
      anchor.group.add(frameMatte);
      anchor.group.add(plane);

      anchor.onTargetFound = () => {
        // Target locked → auto-play the video inside the frame (muted for iOS
        // autoplay; tap Sound to unmute). No manual Play button required.
        if (plane) plane.visible = true;
        if (frameMatte) frameMatte.visible = true;
        video.play().catch(() => {});
        setStatus("playing");
      };
      anchor.onTargetLost = () => {
        video.pause();
        if (plane) plane.visible = false;
        if (frameMatte) frameMatte.visible = false;
        setStatus("scanning");
      };

      await mindarThree.start();
      renderer.setAnimationLoop(() => renderer.render(scene, camera));
      setStatus("scanning");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (/permission|NotAllowedError/i.test(message)) {
        setStatus("permission-denied");
      } else {
        setStatus("error");
        setErrorMessage(message);
      }
    }
  }, [orderId, signedUrls]);

    // ── unmute handler (video auto-plays muted for iOS autoplay) ─────────────
  const unmute = useCallback(() => {
    const v = videoElRef.current;
    if (!v) return;
    v.muted = false;
    void v.play();
  }, []);

  // ── helpers ───────────────────────────────────────────────────────────
  const isOverlayVisible =
    status !== "scanning" && status !== "playing" && status !== "target-found";

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {/* MindAR renders into this container once the camera starts */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* ── Back button — shown once the camera is live ─────────────── */}
      {(status === "scanning" || status === "target-found" || status === "playing") && (
        <Link
          href={`/experience/${slug}/story`}
          className="absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}

      {/* ── "Scanning…" hint shown while camera is live but no target ── */}
      {status === "scanning" && (
        <div className="pointer-events-none absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3 z-10 px-6">
          {/* Animated corner-bracket viewfinder */}
          <div className="relative flex h-52 w-52 items-center justify-center">
            <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-white/60 rounded-tl animate-pulse" />
            <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-white/60 rounded-tr animate-pulse" />
            <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-white/60 rounded-bl animate-pulse" />
            <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-white/60 rounded-br animate-pulse" />
            <p className="text-xs font-medium uppercase tracking-widest text-white/50">
              Aim here
            </p>
          </div>
          <p className="text-sm text-white/60">Point at the printed photo…</p>
        </div>
      )}

            {/* ── Unmute hint — shown once the target locks and video auto-plays ─ */}
      {status === "playing" && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center">
          <button
            onClick={unmute}
            className="flex items-center gap-2 rounded-full bg-black/60 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur active:scale-95"
          >
            <Volume2 className="h-4 w-4" /> Sound
          </button>
        </div>
      )}

      {/* ── Full-screen overlays (welcome / starting / errors) ───────── */}
      {isOverlayVisible && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white z-30">

          {/* WELCOME — pre-launch card */}
          {status === "welcome" && (
            <>
              {/* Viewfinder graphic */}
              <div className="relative flex h-48 w-48 items-center justify-center">
                <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-white/50 rounded-tl" />
                <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-white/50 rounded-tr" />
                <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-white/50 rounded-bl" />
                <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-white/50 rounded-br" />
                <ScanLine className="h-10 w-10 text-white/40" />
              </div>

              <div className="space-y-2 max-w-xs">
                <p className="text-xl font-semibold text-white">
                  {welcomeMessage ?? "Your AR experience is ready ✨"}
                </p>
                <p className="text-sm text-white/60 leading-relaxed">
                  Point your camera at the printed photo and we&apos;ll play your
                  personal video right over it — no QR code needed.
                </p>
              </div>

              <Button
                size="lg"
                className="rounded-full bg-accent px-10 text-white hover:bg-accent/90 shadow-lg"
                onClick={startAR}
              >
                Start
              </Button>
            </>
          )}

          {/* STARTING — spinner */}
          {status === "starting" && (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <p className="text-sm text-white/70">Opening camera…</p>
            </div>
          )}

          {/* PERMISSION DENIED */}
          {status === "permission-denied" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Camera access was denied. Please allow camera access in your
                browser settings, then try again.
              </p>
              <Button
                size="lg"
                className="rounded-full bg-accent px-8 text-white hover:bg-accent/90"
                onClick={startAR}
              >
                Try again
              </Button>
            </>
          )}

          {/* ERROR */}
          {status === "error" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Something went wrong starting the camera
                {errorMessage ? `: ${errorMessage}` : ""}.
              </p>
              <Button
                size="lg"
                className="rounded-full bg-accent px-8 text-white hover:bg-accent/90"
                onClick={startAR}
              >
                Try again
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
