# Deployment Checklist

Everything below has been prepped in code (route config, next.config.mjs,
env var scaffolding) but nothing has been deployed — this project has
only run in local dev so far. This is the checklist to go from local dev
to a live Vercel + hosted Supabase deployment.

## 1. Supabase (production project)

- [ ] Create a production Supabase project (separate from local dev).
- [ ] Run all migrations against it: `supabase link` then
      `supabase db push` (or apply `supabase/migrations/*.sql` in order
      via the SQL editor).
- [ ] Confirm the storage buckets exist with the right limits — migration
      `00000000000005_storage_bucket_limits.sql` sets `uploads-temp` /
      `uploads-active` to a 100MiB file size cap and image/video/octet
      MIME types. This must run on production too, not just local.
- [ ] Seed the admin user: `npm run db:seed:admin` pointed at production
      env vars (or run the equivalent Supabase Auth admin API call
      manually — the seed script assumes local CLI env by default).
- [ ] Note the production `API URL`, `anon key`, and `service_role key`
      for the env vars below.

## 2. Environment variables (set in Vercel project settings)

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` | Production Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role key — **never** expose with a `NEXT_PUBLIC_` prefix |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Real admin credentials, not the dev defaults |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Real `rzp_test_` (or live) keys — leaving these blank keeps Online checkout in simulated mode in production too |
| `RAZORPAY_WEBHOOK_SECRET` | From Razorpay Dashboard → Settings → Webhooks, after registering `https://<domain>/api/webhooks/razorpay` subscribed to `payment.captured` |
| `RESEND_API_KEY` | Real `re_` key — leaving blank keeps shipment emails console-only (which does nothing in a serverless prod environment, i.e. emails silently won't send) |
| `COD_HANDLING_FEE_PAISE` | Same value as local unless the client wants to change it |
| `NEXT_PUBLIC_APP_URL` | The production domain, e.g. `https://scanstory.example.com` |

SMS/WhatsApp OTP and shipped-link delivery (`lib/otp/otp.ts`,
`lib/notify/notify.ts`) have no env-var swap point yet — they need an
actual provider integration (MSG91/Twilio/WhatsApp Business API) before
production launch, since a console.log inside a Vercel function is
invisible to a real customer.

## 3. Function runtime requirements (video compression)

`/api/upload/complete` and `/api/admin/orders/[id]/attach-media` shell
out to bundled ffmpeg/ffprobe binaries and are pinned to
`runtime = "nodejs"` with `maxDuration = 120`.

- **Hobby plan**: default function timeout is 10s — nowhere near enough
  for a 100MB/60s video transcode. Either enable **Fluid Compute** (Hobby
  supports up to 300s under Fluid Compute) or upgrade to Pro.
- **Pro plan**: supports up to 300s by default, which comfortably covers
  the `maxDuration = 120` set in these routes.
- If neither is configured, Vercel will hard-kill the function mid-transcode.
  The compression step is best-effort and fails safe (falls back to the
  original uploaded file — see `lib/upload/compress-video.ts`), so a
  timeout here degrades to "no compression happened," not a broken
  upload — but it's worth fixing rather than relying on the fallback.
- `next.config.mjs` already traces the `ffmpeg-static`/`ffprobe-static`
  binaries into both routes' deployment bundles
  (`experimental.outputFileTracingIncludes`) — no action needed here
  unless a route is renamed/moved, in which case update those keys too.

## 4. Vercel project setup

- [ ] Import the repo into a new Vercel project (framework auto-detects
      as Next.js — no `vercel.json` needed for the standard config).
- [ ] Set all env vars from §2 for the Production environment (and
      Preview, if you want preview deployments to work against a
      staging Supabase project rather than production).
- [ ] Enable Fluid Compute if staying on Hobby (see §3).
- [ ] Deploy, then run through the full walkthrough from `README.md`
      against the live URL: browse → upload → checkout (COD + Online) →
      admin → mark shipped → open experience link on a phone → Screen 1
      cache → Screen 2 AR tracking.
- [ ] Register the Razorpay webhook URL once the domain is live (§2).

## 5. Post-deploy verification

- [ ] Confirm `/admin/login` is reachable only with the real admin
      credentials — the previous dev password must not still work.
- [ ] Place one real test order through Online checkout with real
      `rzp_test_` keys and confirm the webhook reconciles it
      (`app/api/webhooks/razorpay/route.ts`).
- [ ] Upload a video through the customer flow and confirm in the
      Supabase Storage dashboard that the stored file shrank (compression
      ran) — if it didn't, check the Vercel function logs for the
      `/api/upload/complete` invocation for a timeout or ffmpeg error.
- [ ] Confirm Screen 1's background caching still purges
      `uploads-active` files after `confirm-cached` — check the bucket
      in the Supabase dashboard after opening an experience link.
