import JSZip from "jszip";
import { createAdminClient } from "@/lib/supabase/admin";

export async function zipTargetPhotosForOrders(
  assets: Array<{ order_id: string | null; storage_bucket: string; storage_path: string }>
) {
  const supabase = createAdminClient();
  const zip = new JSZip();

  for (const asset of assets) {
    if (!asset.order_id) continue;
    const { data, error } = await supabase.storage
      .from(asset.storage_bucket)
      .download(asset.storage_path);

    if (error || !data) continue;

    const ext = asset.storage_path.split(".").pop() ?? "jpg";
    const buffer = await data.arrayBuffer();
    zip.file(`${asset.order_id}.${ext}`, buffer);
  }

  return zip.generateAsync({ type: "nodebuffer" });
}
