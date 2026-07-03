import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_VIDEO_SIZE_BYTES } from "@/lib/validation/schemas";
import type { MediaType } from "@/types/database.types";

// Client-side checks in lib/upload/validate.ts run in the browser before
// upload and are trivially bypassable — the client uploads straight to
// Supabase Storage via a signed URL, never through our server. The bucket's
// allowed_mime_types/file_size_limit (migration 00000000000005) reject
// blatantly wrong uploads at the storage layer; this re-checks the
// per-media-type rules server-side against what actually landed, using the
// claimed `type` only to pick which rule applies — never trusting it
// outright.
export async function verifyUploadedObject(params: {
  bucket: string;
  path: string;
  type: MediaType;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(params.bucket).info(params.path);

  if (error || !data) {
    return "Uploaded file could not be found in storage";
  }

  if (params.type === "target_photo") {
    if (!data.contentType?.startsWith("image/")) {
      return "File must be an image";
    }
  } else if (params.type === "video") {
    if (!data.contentType?.startsWith("video/")) {
      return "File must be a video";
    }
    if ((data.size ?? 0) > MAX_VIDEO_SIZE_BYTES) {
      return `Video must be under ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB`;
    }
  }

  return null;
}
