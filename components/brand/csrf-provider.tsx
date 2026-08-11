"use client";

import { useEffect } from "react";

let globalCsrfToken: string | null = null;

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalFetch = window.fetch;

    // Patch fetch to automatically inject CSRF token header
    window.fetch = async function (input, init) {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      // Only inject into same-origin API routes, skip the CSRF initialization endpoint itself
      const isApiRoute = url.includes("/api/") && !url.includes("/api/csrf");

      if (isApiRoute && globalCsrfToken) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has("x-csrf-token")) {
          headers.set("x-csrf-token", globalCsrfToken);
        }
        init.headers = headers;
      }

      return originalFetch(input, init);
    };

    // Fetch the CSRF token on mount
    originalFetch("/api/csrf")
      .then((res) => res.json())
      .then((data) => {
        if (data.csrfToken) {
          globalCsrfToken = data.csrfToken;
        }
      })
      .catch((err) => console.error("Failed to initialize CSRF token:", err));

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}
