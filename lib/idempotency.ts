/**
 * Idempotency key utilities to prevent duplicate requests.
 * Stores processed keys in memory with TTL.
 */

type IdempotencyEntry = {
  response: unknown;
  timestamp: number;
};

class IdempotencyStore {
  private store = new Map<string, IdempotencyEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private ttlMs: number = 24 * 60 * 60 * 1000) {
    // 24 hour TTL by default
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Clean up every 5 minutes
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.store.delete(key);
      }
    }
  }

  get(key: string): IdempotencyEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, response: unknown): void {
    this.store.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global idempotency store
export const idempotencyStore = new IdempotencyStore();

/**
 * Extract idempotency key from request headers
 */
export function getIdempotencyKey(request: Request): string | null {
  return request.headers.get("Idempotency-Key");
}

/**
 * Middleware helper to handle idempotent requests
 */
export async function withIdempotency<T>(
  request: Request,
  handler: () => Promise<T>
): Promise<{ response: T; isDuplicate: boolean }> {
  const key = getIdempotencyKey(request);

  if (!key) {
    // No idempotency key provided, proceed normally
    return { response: await handler(), isDuplicate: false };
  }

  const existing = idempotencyStore.get(key);
  if (existing) {
    return { response: existing.response as T, isDuplicate: true };
  }

  const response = await handler();
  idempotencyStore.set(key, response);

  return { response, isDuplicate: false };
}
