import { NextResponse } from "next/server";
import { findExpiredCachedMediaIds, purgeExpiredCachedMedia } from "@/lib/db/cleanup";

export const maxDuration = 60;

// Same auth mechanism as cleanup-abandoned-uploads — see that route's
// comment for why (Vercel auto-adds this header when CRON_SECRET is set).
function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// Triggered daily by vercel.json's cron config. Deletes cloud copies of
// media the client confirmed as cached, once CACHE_GRACE_PERIOD_HOURS has
// passed since confirmation — see migration
// 00000000000006_cached_media_grace_period.sql for the rationale.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mediaAssetIds = await findExpiredCachedMediaIds();

  let purged = 0;
  for (const id of mediaAssetIds) {
    try {
      await purgeExpiredCachedMedia(id);
      purged++;
    } catch (err) {
      console.error(`[CACHE PURGE] Failed to purge media asset ${id}:`, err);
    }
  }

  return NextResponse.json({ found: mediaAssetIds.length, purged });
}
