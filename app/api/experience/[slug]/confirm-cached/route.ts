import { NextResponse } from "next/server";
import { getOrderBySlug } from "@/lib/db/orders";
import { markMediaCachedConfirmed } from "@/lib/db/media-assets";

// Deletion of the cloud copy is NOT immediate — see migration
// 00000000000006_cached_media_grace_period.sql. This only marks the
// client's claim; the daily purge-expired-cached-media cron actually
// deletes storage objects after a grace period, so Screen 2's network
// fallback still has something to fall back to if the local cache silently
// failed.
export async function POST(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const order = await getOrderBySlug(params.slug);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await markMediaCachedConfirmed(order.id);

  return NextResponse.json({ ok: true });
}
