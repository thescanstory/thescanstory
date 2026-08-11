/**
 * CSRF protection utilities.
 * Uses double-submit cookie pattern for stateless CSRF protection.
 */

import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "x-csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a CSRF token and set it as a cookie
 */
export async function generateCsrfToken(): Promise<string> {
  const token = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
  
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return token;
}

/**
 * Verify CSRF token from request
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Middleware helper to add CSRF token to response
 */
export async function withCsrfProtection(response: Response): Promise<Response> {
  const token = await generateCsrfToken();
  response.headers.set(CSRF_HEADER_NAME, token);
  return response;
}

/**
 * Check if CSRF protection is required for this route
 */
export function requiresCsrfProtection(pathname: string): boolean {
  // Protect all mutation endpoints
  const protectedPaths = [
    "/api/checkout",
    "/api/upload",
    "/api/admin",
    "/api/webhooks",
  ];

  return protectedPaths.some((path) => pathname.startsWith(path));
}
