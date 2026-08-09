-- Screen 1 previously deleted a customer's cloud-stored video/photo the
-- instant the browser's confirm-cached POST succeeded — trusting that call
-- alone as proof the files were actually saved to Cache Storage, with no
-- fallback if the local write silently failed (some in-app browser
-- webviews restrict or evict Cache Storage without surfacing an error).
-- These columns let deletion happen on a delayed grace period instead of
-- instantly, so Screen 2's existing network-fallback path
-- (components/experience/ar-scene.tsx resolveMediaUrl) still has a working
-- cloud copy to fall back to for a while if the local cache didn't take.

alter table media_assets add column cached_confirmed_at timestamptz;
alter table media_assets add column storage_purged boolean not null default false;
