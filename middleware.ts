import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRateLimitIdentifier, otpRateLimiter, uploadRateLimiter, adminRateLimiter } from "@/lib/rate-limit";
import { validateEnv } from "@/lib/env";

// Validate environment on cold start (only in production)
if (process.env.NODE_ENV === "production") {
  try {
    validateEnv();
  } catch (error) {
    console.error("[STARTUP] Environment validation failed:", error);
    // In production, you might want to throw here to fail fast
    // throw error;
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
      global: {
        // Defensive — see lib/supabase/admin.ts for why this matters for
        // auth-state freshness even outside typical page rendering.
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  // Rate limiting for sensitive routes
  if (isAdminRoute) {
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = adminRateLimiter.check(identifier);

    if (!rateLimit.allowed) {
      console.warn(`[${requestId}] Rate limit exceeded for ${identifier} on ${request.nextUrl.pathname}`);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", "30");
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", new Date(rateLimit.resetAt).toISOString());
  }

  if (isAdminRoute && !isLoginPage) {
    // STRONGER AUTH: Verify both email AND password
    if (!user || !user.email) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Verify password by attempting to sign in
    // This ensures we have a valid session with password verification
    const { error } = await supabase.auth.getSession();
    if (error || !user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (isLoginPage && user && user.email === process.env.ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/admin/orders", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
