import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_BUCKETS = ["uploads-temp", "uploads-active"];

export async function POST(request: Request) {
  const body = await request.json();
  const { bucket, sessionId, fileName } = body as {
    bucket: string;
    sessionId: string;
    fileName: string;
  };

  if (!ALLOWED_BUCKETS.includes(bucket) || !sessionId || !fileName) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${sessionId}/${Date.now()}-${safeFileName}`;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create signed upload URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  });
}
