# Scan Story — WebAR Personalized E-Commerce MVP Build Prompt for Claude Code

## Assumptions I'm making (swap if wrong before you run this)
- Stack: **Next.js 14 (App Router) + Supabase (DB, Auth, Storage) + Razorpay** (mirrors your GreenFlag stack — reuse env/config patterns if this lives in the same monorepo)
- WebAR library: **MindAR.js** (open-source, no 8th Wall licensing cost — good for MVP)
- Styling: Tailwind + Radix UI (again, matches GreenFlag)
- Deploy target: Vercel (frontend) + Supabase (backend/storage) — mention if you're using something else

---

## PROMPT — paste everything below into Claude Code

```
I'm building the MVP for "Scan Story" — a personalized WebAR e-commerce
platform. Physical products (custom photo frames, wallet cards, T-shirts)
act as AR image targets — when a customer points their phone camera at the
printed product, a personalized video overlays on top of it. No QR codes —
pure image recognition (Natural Feature Tracking). The tagline/framing is
that a physical object comes to life and tells a story when scanned.

Build this as a single Next.js 14 (App Router) project named "scan-story"
using Supabase for DB/Auth/Storage and Razorpay for payments. I need a
working MVP covering every screen below in this session — favor "working
end-to-end with mocked edges" over "one perfect screen." Use TypeScript
throughout.

Branding for MVP purposes: app name "Scan Story" everywhere in copy (page
titles, checkout confirmation, the Screen 1 greeting chrome, admin
dashboard header). Use a placeholder logo/wordmark for now — don't spend
build time on visual identity, just get the name consistently wired in so
it's easy to reskin later.

## 1. Data model (set up in Supabase first)

Tables:
- products (id, name, type[frame|wallet_card|tshirt], price, description, image_url)
- sessions (id, created_at) — pre-checkout holder for uploads so nothing is
  lost if the user abandons payment
- media_assets (id, session_id, order_id nullable, type[target_photo|video],
  storage_path, uploaded_at)
- messages (id, session_id, order_id nullable, text_content)
- orders (id, session_id, customer_id, product_id, status[pending|paid|cod_pending|
  shipped|delivered], payment_method[online|cod], payment_status, cod_verified,
  shipping_address jsonb, phone, email, experience_slug unique, created_at)
- customers (id, name, email, phone, created_at)

Key rule: media uploads attach to a `session_id` BEFORE checkout starts.
On successful order creation, re-parent session's media_assets/messages
rows to the new order_id. This satisfies the requirement that abandoned
payments don't orphan uploaded files.

Set up Supabase Storage buckets: `uploads-temp` (session-scoped, pre-order)
and `uploads-active` (order-scoped, gets purged after Screen 1 caching
confirms — see Section 4).

## 2. Customer-facing storefront

- `/` — product grid (Frame / Wallet Card / T-Shirt), pulls from `products`
- `/product/[id]` — product detail + "Personalize This" CTA
- `/customize/[productId]` — upload flow:
  - Target photo upload (this becomes the printed image — validate it's a
    real photo, reasonable resolution min e.g. 1000x1000)
  - Video upload (client-side compress/validate size + duration cap, e.g.
    max 60s / 100MB for MVP)
  - Text message / love letter (textarea, character limit)
  - Create a `sessions` row on first interaction, attach uploads to it as
    they happen (don't wait for a final submit — upload-as-you-go so
    nothing is lost on refresh)
- `/checkout` — multi-step:
  - Shipping/billing form with validation (name, address, city, pin,
    phone, email)
  - Payment method selector: Online (Razorpay) vs COD
  - If COD: add a flat handling fee (make configurable, default ₹49) and
    require phone OTP verification before order confirms (stub the SMS
    send with a console.log + a fixed dev OTP "123456" for now, but
    structure the function so a real SMS provider (MSG91/Twilio) drops in
    later without touching UI code)
  - If Online: Razorpay checkout in test mode
  - On success: create `orders` row, re-parent session's media + message,
    generate a unique `experience_slug` (short random slug, not the raw
    order id), redirect to `/order-confirmation/[orderId]`

## 3. Admin dashboard (`/admin`, basic auth-gated — Supabase Auth, single
   admin role is fine for MVP)

- `/admin/orders` — table view, filterable by status (Paid / COD Pending /
  Shipped / Delivered) and payment method. Columns: order id, customer,
  product, status, created date, experience link (copy button once
  generated).
- Batch actions:
  - Select multiple orders → "Export CSV" (shipping data: name, address,
    phone, product, order id)
  - Select multiple orders → "Download Photos (ZIP)" — bulk-download all
    target_photo assets for print, named by order id for traceability
  - "Mark as Shipped" bulk action → this is the trigger that (a) sends the
    experience link via the configured channel (stub email/SMS send for
    MVP, log to console + show a toast with the link) and (b) flips
    order status to `shipped`
- `/admin/orders/[id]` — single order detail: full media preview, address,
  payment status, manual status override, regenerate link if needed

## 4. Screen 1 — Greeting & Caching Layer (`/experience/[slug]`)

- Server-side: look up order by `experience_slug`, fetch associated media
  URLs + message text
- Client: animated landing page showing the personalized text message
  (simple fade/slide-in animation, framer-motion is fine) with a "Tap to
  begin" style CTA into Screen 2
- CRITICAL background behavior on page load:
  - Register a Service Worker
  - Use Cache Storage API to fetch and store the target photo + video
    blobs locally (cache keys tied to the order's asset URLs)
  - Once both files are confirmed cached client-side, call a server
    endpoint `/api/experience/[slug]/confirm-cached` which:
    - Marks the order's assets as `cached_confirmed = true` in DB
    - Deletes the corresponding files from Supabase Storage
      (`uploads-active` bucket) to stop storage costs accruing
  - Handle the failure case: if caching fails (old browser, storage
    quota), don't delete server files — fall back to normal network
    fetch in Screen 2 instead of hard-failing

## 5. Screen 2 — Image Recognition AR Experience

- Use **MindAR.js** (mind-ar npm package + its image-tracking module) to:
  - Compile the target photo into an `.mind` target file (MindAR has a
    compiler API/CLI — for MVP, precompute this server-side right after
    upload via a background job so it's ready by the time Screen 2 loads,
    rather than compiling client-side)
  - Launch the device camera, track the target image
  - On target found: play the cached video as a WebGL/video-texture
    overlay anchored to the tracked image; on target lost, pause overlay
  - Read the video from Cache Storage first (offline-first), fall back to
    the original Storage URL if cache missed (pre-purge failure case)
- Handle camera permission denial gracefully with a clear retry UI

## 6. Scalability / routing notes to bake in now
- Use dynamic route `/experience/[slug]` (not `[order-id]` raw — avoids
  leaking sequential order ids)
- Keep the admin order list paginated + indexed by status from the start
  (don't build an unpaginated table even for MVP — 500/day adds up fast)
- Structure the "mark as shipped → send link" step as a single server
  action so it's trivial to swap the stubbed notification for a real
  WhatsApp Business API / SMS / email provider later

## 7. What to stub vs build for real in this MVP pass
Build for real: full upload → checkout → order → admin → Screen 1 caching
→ Screen 2 AR flow, end to end, with real Supabase tables and real
Razorpay test-mode payment.
Stub (but structure cleanly for later swap-in): SMS OTP sending, WhatsApp/
email link delivery, MindAR .mind file compilation (can run it manually /
synchronously for MVP if the async job queue is too much scope right now).

## 8. Deliverable
Working local dev server I can run with `npm run dev`, seeded with 3 demo
products, that I can walk through start-to-finish: browse → upload →
checkout (COD and Razorpay test mode) → see it land in /admin → mark
shipped → open the experience link on my phone → see Screen 1 cache →
launch Screen 2 and see AR tracking work against a printed or on-screen
photo target.

Ask me before making structural decisions I haven't specified above
(e.g., exact file compression limits) — pick a sensible default and note
it, don't block on it.
```

---

## Before you paste this in
- Have your Razorpay **test-mode** keys and Supabase project URL/anon key ready — Claude Code will ask for env vars.
- If you're *not* putting this in a fresh repo, tell it your existing folder structure first so it doesn't fight your conventions.
- MindAR's `.mind` compiler is the part most likely to need a manual nudge — if Claude Code struggles with it, ask it to fall back to a simpler client-side compile step for the demo rather than getting stuck.
