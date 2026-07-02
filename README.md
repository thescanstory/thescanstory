# Scan Story

Personalized WebAR e-commerce MVP. Physical products (photo frames, wallet
cards, T-shirts) act as AR image targets — pointing a phone camera at the
printed product plays a personalized video overlay via image recognition
(MindAR.js), no QR codes.

## Stack

Next.js 14 (App Router, TypeScript) · Supabase (Postgres, Auth, Storage,
run locally via the Supabase CLI) · Razorpay (test mode, auto-simulated
until real keys are set) · Tailwind CSS + shadcn/ui · MindAR.js + three.js

## Prerequisites

- Node 20 (`brew install node@20`)
- Supabase CLI (`brew install supabase/tap/supabase`)
- Docker running (Docker Desktop, or `brew install colima && colima start`)
  — required for `supabase start`; there is no way around this for local dev.

## First-time setup

```bash
npm install
supabase start          # first run pulls Docker images, takes a few minutes
supabase db reset        # applies migrations + seed data
cp .env.local.example .env.local
```

Then fill in `.env.local`:
- Run `supabase status` and copy `API URL` → `NEXT_PUBLIC_SUPABASE_URL` /
  `SUPABASE_URL`, `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`.
- Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` to whatever you want the admin login
  to be.
- Leave `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` blank/placeholder to run
  Online checkout in simulated "Test Mode" — no real keys needed to demo
  the full flow. Cash on Delivery works with zero external keys either way.

Seed the admin user (after `supabase start`):

```bash
npm run db:seed:admin
```

Regenerate types any time the schema changes:

```bash
npm run db:types
```

## Running

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## Walkthrough

1. Browse products → pick one → "Personalize This"
2. Upload a target photo (≥1000×1000px), a video (≤60s, ≤100MB), and a
   message — uploads happen as you go, so nothing is lost on refresh
3. Checkout — try both COD (OTP is always `123456` in dev, check the
   server console for the "sent" code) and Online (runs in simulated
   Test Mode without real Razorpay keys)
4. Sign in to `/admin/orders`, find the order, select it, "Mark as
   Shipped" — this generates the experience link (logged to the server
   console + copyable from the table)
5. Open `/experience/[slug]` on a phone on the same Wi-Fi network as your
   dev machine (see note below on HTTPS/LAN access) — watch it cache the
   media in the background, then tap through to the AR screen and point
   the camera at the uploaded photo (on another screen, or printed)

## Testing on a phone

Camera access requires a secure context. Run the dev server with HTTPS:

```bash
npm run dev -- --experimental-https
```

Your phone will show a one-time "untrusted certificate" warning — the
mkcert-generated cert is only trusted on the machine running the dev
server, so you'll need to click through it once.

Local Supabase (`localhost:54321`) isn't reachable from a phone. For
device testing, point `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` in
`.env.local` at your Mac's LAN IP instead of `localhost`, and
`NEXT_PUBLIC_APP_URL` at `https://<your-lan-ip>:3000`.

## What's stubbed

- **SMS OTP**: always logs to the server console (`[OTP STUB]`) with a
  fixed `123456` code in dev — swap point is `lib/otp/otp.ts`.
- **Shipped-link delivery**: logs to the server console
  (`[NOTIFY STUB]`) instead of sending email/WhatsApp/SMS — swap point is
  `lib/notify/notify.ts`.
- **Online payments**: runs in simulated mode until real `rzp_test_`
  keys are set — swap point is `lib/payments/razorpay.ts`
  (`isPaymentsConfigured`).
- **Video compression**: validation only (size/duration caps), not real
  transcoding.
