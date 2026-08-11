import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadRateLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const ALLOWED_BUCKETS = ["uploads-temp", "uploads-active"];
const MAX_FILE_NAME_LENGTH = 255;

export async function POST(request: Request) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = await uploadRateLimiter.check(identifier);

    if (!rateLimit.allowed) {
      logger.warn("Upload rate limit exceeded", { identifier });
      return NextResponse.json(
        { error: "Too many upload requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const { bucket, sessionId, fileName } = body as {
      bucket: string;
      sessionId: string;
      fileName: string;
    };

    if (!ALLOWED_BUCKETS.includes(bucket) || !sessionId || !fileName) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Validate file name length
    if (fileName.length > MAX_FILE_NAME_LENGTH) {
      return NextResponse.json({ error: "File name too long" }, { status: 400 });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${sessionId}/${Date.now()}-${safeFileName}`;

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      logger.error("Failed to create signed upload URL", error, { bucket, path });
      return NextResponse.json(
        { error: error?.message ?? "Failed to create signed upload URL" },
        { status: 500 }
      );
    }

    logger.info("Upload URL created", { bucket, path, sessionId });
    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    });
  } catch (error) {
    logger.error("Error in upload/sign", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
