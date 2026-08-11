/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Extract idempotency key from request headers
 */
export function getIdempotencyKey(request: Request): string | null {
  return request.headers.get("Idempotency-Key");
}

/**
 * Serverless-safe helper to handle idempotent requests using Supabase database.
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

  const supabase = createAdminClient() as any;

  try {
    const { data, error } = await supabase
      .from("idempotency_keys")
      .select("response")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("[IDEMPOTENCY] Database query failed, proceeding without deduplication:", error);
      return { response: await handler(), isDuplicate: false };
    }

    if (data) {
      return { response: data.response as T, isDuplicate: true };
    }

    const response = await handler();

    const { error: insertError } = await supabase
      .from("idempotency_keys")
      .insert({
        key,
        response: response as any,
      });

    if (insertError) {
      console.error("[IDEMPOTENCY] Failed to save idempotency key:", insertError);
    }

    return { response, isDuplicate: false };
  } catch (err) {
    console.error("[IDEMPOTENCY] Unexpected error:", err);
    return { response: await handler(), isDuplicate: false };
  }
}

