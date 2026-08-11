import { createClient } from "@/lib/supabase/server";
import { adminRateLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// middleware.ts's admin-session check only covers /admin/:path* (page
// routes) — /api/admin/**/route.ts handlers are NOT in its matcher, so
// without this they're reachable by anyone who knows the URL, no session
// required. Call at the top of every admin API route handler.
export async function isAdminAuthenticated(request?: Request): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email || user.email !== process.env.ADMIN_EMAIL) {
      logger.warn("Unauthorized admin access attempt", {
        email: user?.email || "none",
        userId: user?.id || "none",
      });
      return false;
    }

    // Rate limiting for admin API routes
    if (request) {
      const identifier = getRateLimitIdentifier(request);
      const rateLimit = adminRateLimiter.check(identifier);

      if (!rateLimit.allowed) {
        logger.warn("Admin rate limit exceeded", {
          identifier,
          email: user.email,
          userId: user.id,
        });
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error("Error checking admin authentication", error);
    return false;
  }
}
