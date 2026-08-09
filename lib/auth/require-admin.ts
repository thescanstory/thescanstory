import { createClient } from "@/lib/supabase/server";

// middleware.ts's admin-session check only covers /admin/:path* (page
// routes) — /api/admin/**/route.ts handlers are NOT in its matcher, so
// without this they're reachable by anyone who knows the URL, no session
// required. Call at the top of every admin API route handler.
export async function isAdminAuthenticated() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user && user.email === process.env.ADMIN_EMAIL);
}
