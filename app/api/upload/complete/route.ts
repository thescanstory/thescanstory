import { NextResponse } from "next/server";
import { createMediaAsset } from "@/lib/db/media-assets";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUploadedObject } from "@/lib/upload/verify-uploaded";
import type { MediaType } from "@/types/database.types";

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

  const asset = await createMediaAsset({
    sessionId,
    type,
    storageBucket,
    storagePath,
    mindTargetPath,
  });

  return NextResponse.json({ asset });
}
