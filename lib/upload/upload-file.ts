"use client";

import { createClient } from "@/lib/supabase/client";

export async function uploadFileDirect(params: {
  bucket: "uploads-temp" | "uploads-active";
  sessionId: string;
  fileName: string;
  file: File | Blob;
}) {
  const signRes = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket: params.bucket,
      sessionId: params.sessionId,
      fileName: params.fileName,
    }),
  });

  if (!signRes.ok) throw new Error("Failed to get upload URL");
  const { token, path } = (await signRes.json()) as {
    token: string;
    path: string;
  };

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(params.bucket)
    .uploadToSignedUrl(path, token, params.file);

  if (error) throw error;

  return { path };
}
