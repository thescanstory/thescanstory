"use client";

import { useEffect, useState } from "react";

// Persists the pre-checkout session id per product in localStorage so
// uploads survive a refresh (spec requirement: abandoned checkouts must
// never orphan uploaded files, and in-progress uploads must never be lost
// on refresh either).
export function useCustomizeSession(productId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storageKey = `scan-story-session-${productId}`;
    const existing = localStorage.getItem(storageKey);

    if (existing) {
      setSessionId(existing);
      setLoading(false);
      return;
    }

    fetch("/api/session", { method: "POST" })
      .then((res) => res.json())
      .then((data: { sessionId: string }) => {
        localStorage.setItem(storageKey, data.sessionId);
        setSessionId(data.sessionId);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  return { sessionId, loading };
}
