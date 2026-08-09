import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_TTL_HOURS = 48;

function getCutoffIso() {
  const hours = Number(process.env.ABANDONED_SESSION_TTL_HOURS ?? DEFAULT_TTL_HOURS);
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// Sessions past the abandonment window that never converted to an order —
// checked via `orders.session_id` rather than `media_assets.order_id`,
// since reparentSessionMediaToOrder() (lib/db/media-assets.ts) sets
// order_id but never clears session_id, so session_id alone can't
// distinguish claimed from unclaimed.
export async function findAbandonedSessionIds(limit = 200) {
  const supabase = createAdminClient();
  const cutoff = getCutoffIso();

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
