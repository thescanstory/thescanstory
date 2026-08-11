import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { zipTargetPhotosForOrders } from "@/lib/utils/zip";
import { isAdminAuthenticated } from "@/lib/auth/require-admin";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids } = (await request.json()) as { ids: string[] };
  if (!ids?.length) {
    return NextResponse.json({ error: "No orders selected" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("media_assets")
    .select("order_id, storage_bucket, storage_path")
    .in("order_id", ids)
    .eq("type", "target_photo");

  if (error || !data) {
    return NextResponse.json({ error: "Failed to load photos" }, { status: 500 });
  }

  const zipBuffer = await zipTargetPhotosForOrders(data);

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="scan-story-photos.zip"`,
    },
  });
}
