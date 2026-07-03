import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMediaAssetForOrder } from "@/lib/db/media-assets";
import { verifyUploadedObject } from "@/lib/upload/verify-uploaded";
import type { MediaType } from "@/types/database.types";

// Counterpart to /api/upload/complete for orders placed without uploading —
// admin received the photo/video some other way (WhatsApp, email, in
// person) and attaches it here after uploading it through the admin UI.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { type, storageBucket, storagePath, mindTargetPath } = body as {
    type: MediaType;
    storageBucket: string;
    storagePath: string;
    mindTargetPath?: string;
  };

  if (!type || !storageBucket || !storagePath) {
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

  const asset = await createMediaAssetForOrder({
    orderId: params.id,
    type,
    storageBucket,
    storagePath,
    mindTargetPath,
  });

  return NextResponse.json({ asset });
}
