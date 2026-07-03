-- Uploads bypass our Next.js server entirely (client uploads straight to
-- Supabase Storage via a signed URL), so client-side validation in
-- lib/upload/validate.ts can be trivially bypassed by anyone calling
-- /api/upload/sign directly. Enforce a coarse type/size backstop at the
-- storage layer itself — this is the one checkpoint a malicious client
-- can't skip. Per-media-type limits (video duration, exact size cap,
-- claimed type vs actual) are re-checked server-side in
-- app/api/upload/complete/route.ts using this same ceiling as the floor.

update storage.buckets
set
  file_size_limit = 104857600, -- 100MiB, matches MAX_VIDEO_SIZE_BYTES
  allowed_mime_types = array['image/*', 'video/*', 'application/octet-stream']
where id in ('uploads-temp', 'uploads-active');
