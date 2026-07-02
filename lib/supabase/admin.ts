import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Service-role client — bypasses RLS. Server-only: every read/write to
// products/sessions/orders/media_assets/messages/otp_codes goes through
// this client rather than hand-writing per-table RLS policies. Never
// import this from a client component or expose the key to the browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        // Next.js patches the global fetch and caches GET requests by
        // default — without this, App Router silently serves stale
        // Supabase REST responses even on routes marked force-dynamic.
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );
}
