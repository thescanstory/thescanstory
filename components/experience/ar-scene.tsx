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

function getVideoDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth || 1, height: video.videoHeight || 1 });
    };
    video.onerror = () => resolve({ width: 1, height: 1 });
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

      <Link
        href={`/experience/${slug}`}
        className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      {status !== "running" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 px-6 text-center text-white">
          {status === "idle" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Point your camera at the printed photo to bring your story to
                life.
              </p>
              <Button size="lg" className="bg-accent text-white hover:bg-accent/90" onClick={start}>
                Start camera
              </Button>
            </>
          )}
          {status === "starting" && <p>Starting camera…</p>}
          {status === "permission-denied" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Camera access was denied. Please allow camera access in your
                browser settings, then try again.
              </p>
              <Button size="lg" className="bg-accent text-white hover:bg-accent/90" onClick={start}>
                Try again
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Something went wrong starting the camera{errorMessage ? `: ${errorMessage}` : ""}.
              </p>
              <Button size="lg" className="bg-accent text-white hover:bg-accent/90" onClick={start}>
                Try again
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
