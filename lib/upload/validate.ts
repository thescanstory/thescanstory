"use client";

import {
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_SIZE_BYTES,
  MIN_TARGET_PHOTO_DIMENSION,
} from "@/lib/validation/schemas";

export async function validateTargetPhoto(file: File) {
  if (!file.type.startsWith("image/")) {
    return "File must be an image";
  }
  const bitmap = await createImageBitmap(file);
  if (
    bitmap.width < MIN_TARGET_PHOTO_DIMENSION ||
    bitmap.height < MIN_TARGET_PHOTO_DIMENSION
  ) {
    return `Photo must be at least ${MIN_TARGET_PHOTO_DIMENSION}x${MIN_TARGET_PHOTO_DIMENSION}px (got ${bitmap.width}x${bitmap.height})`;
  }
  return null;
}

export async function validateVideo(file: File) {
  if (!file.type.startsWith("video/")) {
    return "File must be a video";
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return `Video must be under ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB`;
  }

  const duration = await new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error("Could not read video metadata"));
    video.src = URL.createObjectURL(file);
  });

  if (duration > MAX_VIDEO_DURATION_SECONDS) {
    return `Video must be under ${MAX_VIDEO_DURATION_SECONDS}s (got ${Math.round(duration)}s)`;
  }
  return null;
}
