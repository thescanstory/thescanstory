import { createAdminClient } from "@/lib/supabase/admin";
import type { MediaType } from "@/types/database.types";

export async function createMediaAsset(params: {
  sessionId: string;
  type: MediaType;
  storageBucket: string;
  storagePath: string;
  mindTargetPath?: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      session_id: params.sessionId,
      type: params.type,
      storage_bucket: params.storageBucket,
      storage_path: params.storagePath,
      mind_target_path: params.mindTargetPath ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getMediaAssetsBySession(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("session_id", sessionId);

  if (error) throw error;
  return data;
}

export async function getMediaAssetsByOrder(orderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("order_id", orderId);

  if (error) throw error;
  return data;
}

// Re-parents a session's media rows to the newly created order. Called
// right after order creation so abandoned checkouts never orphan uploads
// (session-scoped rows just stay session-scoped forever, no order ever
// claims them).
export async function reparentSessionMediaToOrder(
  sessionId: string,
  orderId: string
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("media_assets")
    .update({ order_id: orderId })
    .eq("session_id", sessionId);

  if (error) throw error;
}

export async function markMediaCachedConfirmed(orderId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("media_assets")
    .update({ cached_confirmed: true })
    .eq("order_id", orderId);

  if (error) throw error;
}

// Moves an order's files from the session-scoped `uploads-temp` bucket into
// the order-scoped `uploads-active` bucket. Storage has no cross-bucket
// move, so this downloads + re-uploads + deletes the original. Runs once,
// right after checkout confirms — everything after this point reads from
// uploads-active until Screen 1 caching confirms and purges it.
export async function moveOrderMediaToActiveBucket(orderId: string) {
  const supabase = createAdminClient();
  const { data: assets, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("order_id", orderId);
  if (error) throw error;

  async function relocate(bucket: string, path: string) {
    const { data: file, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(path);
    if (downloadError || !file) return null;

    const fileName = path.split("/").pop();
    const newPath = `${orderId}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("uploads-active")
      .upload(newPath, file, { upsert: true });
    if (uploadError) return null;

    await supabase.storage.from(bucket).remove([path]);
    return newPath;
  }

  for (const asset of assets) {
    if (asset.storage_bucket === "uploads-active") continue;

    const newPath = await relocate(asset.storage_bucket, asset.storage_path);
    if (!newPath) continue;

    const newMindPath = asset.mind_target_path
      ? await relocate(asset.storage_bucket, asset.mind_target_path)
      : null;

    await supabase
      .from("media_assets")
      .update({
        storage_bucket: "uploads-active",
        storage_path: newPath,
        mind_target_path: newMindPath ?? asset.mind_target_path,
      })
      .eq("id", asset.id);
  }
}
