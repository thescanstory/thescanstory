import { NextResponse } from "next/server";
import { getOrderBySlug } from "@/lib/db/orders";
import { getMediaAssetsByOrder, markMediaCachedConfirmed } from "@/lib/db/media-assets";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const order = await getOrderBySlug(params.slug);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assets = await getMediaAssetsByOrder(order.id);
  await markMediaCachedConfirmed(order.id);

  // Best-effort cleanup — deletion failures shouldn't block the UX, the
  // client has already confirmed everything is cached locally.
  const supabase = createAdminClient();
  const paths = assets.flatMap((a) =>
    [a.storage_path, a.mind_target_path].filter((p): p is string => !!p)
  );
  if (paths.length > 0) {
    try {
      await supabase.storage.from("uploads-active").remove(paths);
    } catch {
      // Non-fatal — see comment above.
    }
  }

  return NextResponse.json({ ok: true });
}
