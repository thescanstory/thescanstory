/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

class RateLimiter {
  constructor(private config: RateLimitConfig) {}

  async check(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const supabase = createAdminClient() as any;

    try {
      const { data, error } = await supabase
        .from("rate_limits")
        .select("count, reset_at")
        .eq("key", identifier)
        .maybeSingle();

      if (error) {
        console.error("[RATE LIMIT] Database query failed, falling back to allow:", error);
        return { allowed: true, remaining: this.config.maxRequests - 1, resetAt: now + this.config.windowMs };
      }

      if (!data || now > new Date(data.reset_at).getTime()) {
        // Create or reset window
        const resetAt = new Date(now + this.config.windowMs).toISOString();
        const { error: upsertError } = await supabase
          .from("rate_limits")
          .upsert({
            key: identifier,
            count: 1,
            reset_at: resetAt,
          });

        if (upsertError) {
          console.error("[RATE LIMIT] Upsert failed:", upsertError);
        }

        return { allowed: true, remaining: this.config.maxRequests - 1, resetAt: new Date(resetAt).getTime() };
      }

      if (data.count >= this.config.maxRequests) {
        return { allowed: false, remaining: 0, resetAt: new Date(data.reset_at).getTime() };
      }

      const newCount = data.count + 1;
      const { error: updateError } = await supabase
        .from("rate_limits")
        .update({ count: newCount })
        .eq("key", identifier);

      if (updateError) {
        console.error("[RATE LIMIT] Update failed:", updateError);
      }

      return {
        allowed: true,
        remaining: this.config.maxRequests - newCount,
        resetAt: new Date(data.reset_at).getTime(),
      };
    } catch (err) {
      console.error("[RATE LIMIT] Unexpected error:", err);
      return { allowed: true, remaining: this.config.maxRequests - 1, resetAt: now + this.config.windowMs };
    }
  }

  destroy() {
    // No-op for DB rate limiter
  }
}

// Rate limiters for different endpoint types
export const otpRateLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 3 }); // 3 OTPs per minute
export const uploadRateLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 10 }); // 10 uploads per minute
export const adminRateLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 30 }); // 30 admin actions per minute

/**
 * Get identifier for rate limiting (IP-based)
 */
export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : null;
  return ip || request.headers.get("x-real-ip") || "unknown";
}

