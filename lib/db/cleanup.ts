import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_TTL_HOURS = 48;
const DEFAULT_CACHE_GRACE_HOURS = 24;

function getCutoffIso(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// Sessions past the abandonment window that never converted to an order —
// checked via `orders.session_id` rather than `media_assets.order_id`,
// since reparentSessionMediaToOrder() (lib/db/media-assets.ts) sets
// order_id but never clears session_id, so session_id alone can't
// distinguish claimed from unclaimed.
export async function findAbandonedSessionIds(limit = 200) {
  const supabase = createAdminClient();
  const hours = Number(process.env.ABANDONED_SESSION_TTL_HOURS ?? DEFAULT_TTL_HOURS);
  const cutoff = getCutoffIso(hours);

  const { data: staleSessions, error } = await supabase
    .from("sessions")
    .select("id")
    .lt("created_at", cutoff)
    .limit(limit);
  if (error) throw error;
  if (!staleSessions.length) return [];

  const ids = staleSessions.map((s) => s.id);
  const { data: claimedOrders, error: ordersError } = await supabase
    .from("orders")
    .select("session_id")
    .in("session_id", ids);
  if (ordersError) throw ordersError;

  const claimed = new Set(claimedOrders.map((o) => o.session_id));
  return ids.filter((id) => !claimed.has(id));
}

// Deletes an abandoned session's uploaded files and DB rows. Deleting the
// session itself cascades otp_codes (schema: on delete cascade); media_assets
// and messages use "on delete set null" instead, so those need explicit
// deletes first or they'd be orphaned rather than removed.
export async function purgeAbandonedSession(sessionId: string) {
  const supabase = createAdminClient();

  const { data: assets, error: assetsError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("session_id", sessionId);
  if (assetsError) throw assetsError;

  for (const asset of assets ?? []) {
    const paths = [asset.storage_path, asset.mind_target_path].filter(
      (p): p is string => !!p
    );
    if (paths.length) {
      await supabase.storage.from(asset.storage_bucket).remove(paths);
    }
  }

  await supabase.from("media_assets").delete().eq("session_id", sessionId);
  await supabase.from("messages").delete().eq("session_id", sessionId);
  await supabase.from("sessions").delete().eq("id", sessionId);
}

// Media the client confirmed as locally cached more than the grace period
// ago and whose cloud copy hasn't been purged yet. See migration
// 00000000000006_cached_media_grace_period.sql for why this is delayed
// rather than immediate.
export async function findExpiredCachedMediaIds(limit = 500) {
  const supabase = createAdminClient();
  const hours = Number(process.env.CACHE_GRACE_PERIOD_HOURS ?? DEFAULT_CACHE_GRACE_HOURS);
  const cutoff = getCutoffIso(hours);

  const { data, error } = await supabase
    .from("media_assets")
    .select("id")
    .eq("cached_confirmed", true)
    .eq("storage_purged", false)
    .lt("cached_confirmed_at", cutoff)
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => row.id);
}

// Deletes the cloud storage object(s) for one media_assets row and marks
// it purged so the daily cron doesn't reprocess it. Leaves the row itself
// intact (storage_path can't be nulled — it's NOT NULL — and admin tooling
// like the order-detail page still reads these rows).
export async function purgeExpiredCachedMedia(mediaAssetId: string) {
  const supabase = createAdminClient();

  const { data: asset, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", mediaAssetId)
    .single();
  if (error) throw error;

  const paths = [asset.storage_path, asset.mind_target_path].filter(
    (p): p is string => !!p
  );
  if (paths.length) {
    await supabase.storage.from(asset.storage_bucket).remove(paths);
  }

  await supabase.from("media_assets").update({ storage_purged: true }).eq("id", mediaAssetId);
}
