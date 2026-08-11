import { NextResponse } from "next/server";
import { createMediaAsset } from "@/lib/db/media-assets";
import { createAdminClient } from "@/lib/supabase/admin";
import { compressVideoInStorage } from "@/lib/upload/compress-video";
import { verifyUploadedObject } from "@/lib/upload/verify-uploaded";
import { logger } from "@/lib/logger";
import type { MediaType } from "@/types/database.types";

// Video compression shells out to bundled ffmpeg/ffprobe binaries and can
// take tens of seconds for a full-length clip — needs the Node.js runtime
// (not Edge) and a longer function budget than the Vercel default. See the
// deployment checklist for the plan-tier implications.
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, type, storageBucket, storagePath, mindTargetPath } =
      body as {
        sessionId: string;
        type: MediaType;
        storageBucket: string;
        storagePath: string;
        mindTargetPath?: string;
      };

    if (!sessionId || !type || !storageBucket || !storagePath) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Server-side file size validation (belt-and-suspenders approach)
    const supabase = createAdminClient();
    const { data: fileInfo, error: fileError } = await supabase.storage
      .from(storageBucket)
      .list(storagePath.split("/").slice(0, -1).join("/"), {
        search: storagePath.split("/").pop(),
      });

    if (!fileError && fileInfo && fileInfo[0]) {
      const maxSize = type === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for photos
      const size = fileInfo[0].metadata?.size || 0;
      if (size > maxSize) {
        logger.warn("File exceeds size limit", {
          storageBucket,
          storagePath,
          size,
          maxSize,
        });
        return NextResponse.json(
          { error: `File exceeds maximum size of ${maxSize / (1024 * 1024)}MB` },
          { status: 400 }
        );
      }
    }

    const validationError = await verifyUploadedObject({
      bucket: storageBucket,
      path: storagePath,
      type,
    });
    if (validationError) {
      const supabase = createAdminClient();
      const pathsToRemove = mindTargetPath
        ? [storagePath, mindTargetPath]
        : [storagePath];
      await supabase.storage.from(storageBucket).remove(pathsToRemove);
      logger.warn("Upload validation failed", { storageBucket, storagePath, error: validationError });
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Best-effort — see compressVideoInStorage for why a failure here never
    // blocks order completion; the already-validated original just ships as-is.
    if (type === "video") {
      try {
        const result = await compressVideoInStorage({ bucket: storageBucket, path: storagePath });
        if (result.compressed) {
          logger.info("Video compressed successfully", { storageBucket, storagePath });
        } else {
          logger.warn("Video compression skipped or failed", { storageBucket, storagePath });
        }
      } catch (error) {
        logger.error("Video compression error", error, { storageBucket, storagePath });
        // Continue with original file - best-effort approach
      }
    }

    const asset = await createMediaAsset({
      sessionId,
      type,
      storageBucket,
      storagePath,
      mindTargetPath,
    });

    logger.info("Media asset created", { assetId: asset.id, sessionId, type });
    return NextResponse.json({ asset });
  } catch (error) {
    logger.error("Error completing upload", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
