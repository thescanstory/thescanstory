/**
 * Simple in-memory rate limiter for server-side use.
 * For production, consider Upstash Redis or Vercel Edge Middleware.
 */

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private config: RateLimitConfig) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetAt) {
      // New window
      const resetAt = now + this.config.windowMs;
      this.store.set(identifier, { count: 1, resetAt });
      return { allowed: true, remaining: this.config.maxRequests - 1, resetAt };
    }

    if (entry.count >= this.config.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: this.config.maxRequests - entry.count, resetAt };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
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
