import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { ids } = (await request.json()) as { ids: string[] };
    if (!ids || !ids.length) {
      return NextResponse.json({ error: "No orders selected" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Get media assets for these orders where type = 'target_photo'
    const { data: assets, error } = await supabase
      .from("media_assets")
      .select("order_id, storage_bucket, storage_path")
      .in("order_id", ids)
      .eq("type", "target_photo");

    if (error) throw error;
    if (!assets || assets.length === 0) {
      return NextResponse.json({ previews: [] });
    }

    // 2. Generate signed URLs
    const previews = await Promise.all(
      assets.map(async (asset) => {
        const { data } = await supabase.storage
          .from(asset.storage_bucket)
          .createSignedUrl(asset.storage_path, 3600);
        return {
          orderId: asset.order_id,
          url: data?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({ previews });
  } catch (err) {
    console.error("Failed to generate photo previews:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
