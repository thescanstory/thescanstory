import { NextResponse } from "next/server";
import { createMediaAsset } from "@/lib/db/media-assets";
import { createAdminClient } from "@/lib/supabase/admin";
import { compressVideoInStorage } from "@/lib/upload/compress-video";
import { verifyUploadedObject } from "@/lib/upload/verify-uploaded";
import type { MediaType } from "@/types/database.types";

// Video compression shells out to bundled ffmpeg/ffprobe binaries and can
// take tens of seconds for a full-length clip — needs the Node.js runtime
// (not Edge) and a longer function budget than the Vercel default. See the
// deployment checklist for the plan-tier implications.
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
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
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Best-effort — see compressVideoInStorage for why a failure here never
  // blocks order completion; the already-validated original just ships as-is.
  if (type === "video") {
    await compressVideoInStorage({ bucket: storageBucket, path: storagePath });
  }

  const asset = await createMediaAsset({
    sessionId,
    type,
    storageBucket,
    storagePath,
    mindTargetPath,
  });

  return NextResponse.json({ asset });
}
