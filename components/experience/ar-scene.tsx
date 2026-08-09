"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { getCachedMedia } from "@/lib/cache/media-cache";
import type { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

type Status = "idle" | "starting" | "running" | "permission-denied" | "error";

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

// Must never hang: this runs before mindarThree.start() (the call that
// actually opens the camera), so a stalled off-DOM video element here —
// e.g. a known iOS Safari quirk where loadedmetadata/error can both fail
// to fire — would silently block camera access forever with no visible
// error. Falls back to a 1:1 guess (a slightly wrong crop) rather than
// risk that; the camera opening is the priority, not a perfect crop.
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
    video.onloadedmetadata = () => {
      settle({ width: video.videoWidth || 1, height: video.videoHeight || 1 });
    };
    video.onerror = () => settle({ width: 1, height: 1 });
    setTimeout(() => settle({ width: 1, height: 1 }), 3000);
  });
}

// The plane is sized to the printed photo's exact proportions (see
// PlaneGeometry(1, aspect) below) — that part already matches the frame.
// This handles the separate concern of the VIDEO's own aspect ratio: if it
// doesn't match the photo's, mapping it 1:1 onto that plane would stretch/
// squash the footage. Crops instead (like CSS object-fit: cover) so the
// video always looks correct, whatever its source dimensions.
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
}: {
  orderId: string;
  slug: string;
  signedUrls: { photo: string; video: string; mind: string };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindarRef = useRef<MindARThree | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const start = useCallback(async () => {
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
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

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

      const anchor = mindarThree.addAnchor(0);
      anchor.group.add(plane);
      anchor.onTargetFound = () => video.play().catch(() => {});
      anchor.onTargetLost = () => video.pause();

      await mindarThree.start();
      renderer.setAnimationLoop(() => renderer.render(scene, camera));
      setStatus("running");
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

  return (
    <div className="relative h-screen w-screen bg-black">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Back button — only visible once the camera is running */}
      {status === "running" && (
        <Link
          href={`/experience/${slug}/story`}
          className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}

      {status !== "running" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
          {status === "idle" && (
            <>
              {/* Scan frame hint graphic */}
              <div className="relative flex h-52 w-52 items-center justify-center">
                {/* Corner brackets */}
                <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-white/60 rounded-tl" />
                <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-white/60 rounded-tr" />
                <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-white/60 rounded-bl" />
                <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-white/60 rounded-br" />
                <p className="text-xs font-medium uppercase tracking-widest text-white/50">
                  Aim at your frame
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-white">Scan your printed frame</p>
                <p className="max-w-xs text-sm text-white/60">
                  Point your camera at the photo frame — your video will play right over it.
                </p>
              </div>
              <Button
                size="lg"
                className="rounded-full bg-accent px-8 text-white hover:bg-accent/90"
                onClick={start}
              >
                Open Camera
              </Button>
            </>
          )}
          {status === "starting" && (
            <p className="text-sm text-white/70">Starting camera…</p>
          )}
          {status === "permission-denied" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Camera access was denied. Please allow camera access in your
                browser settings, then try again.
              </p>
              <Button
                size="lg"
                className="rounded-full bg-accent px-8 text-white hover:bg-accent/90"
                onClick={start}
              >
                Try again
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Something went wrong starting the camera
                {errorMessage ? `: ${errorMessage}` : ""}.
              </p>
              <Button
                size="lg"
                className="rounded-full bg-accent px-8 text-white hover:bg-accent/90"
                onClick={start}
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
