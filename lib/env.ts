import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // Admin
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email"),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),

  // Optional: Razorpay (can be blank in dev/test mode)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Optional: Notifications (can be blank in dev/test mode)
  RESEND_API_KEY: z.string().optional(),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  MSG91_OTP_TEMPLATE_ID: z.string().optional(),
  MSG91_SHIPPED_TEMPLATE_ID: z.string().optional(),

  // Optional: COD
  COD_HANDLING_FEE_PAISE: z.coerce.number().int().nonnegative().default(4900),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Validates and caches environment variables.
 * Call this once at app startup in production.
 */
export function validateEnv(): Env {
  if (cachedEnv) return cachedEnv;

  try {
    const env = envSchema.parse({
      ...process.env,
      // Convert COD_HANDLING_FEE_PAISE to number
      COD_HANDLING_FEE_PAISE: process.env.COD_HANDLING_FEE_PAISE,
    });

    // Additional check: reject default/placeholder values in production
    if (process.env.NODE_ENV === "production") {
      if (env.ADMIN_PASSWORD === "change-me-please") {
        throw new Error("ADMIN_PASSWORD must be changed from default value in production");
      }
      if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_ID.includes("xxxxxxxxxxxx")) {
        throw new Error("RAZORPAY_KEY_ID contains placeholder value");
      }
      if (env.RESEND_API_KEY && env.RESEND_API_KEY.includes("xxxxxxxxxxxx")) {
        throw new Error("RESEND_API_KEY contains placeholder value");
      }
    }

    cachedEnv = env;
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("\n");
      throw new Error(`Environment validation failed:\n${issues}`);
    }
    throw error;
  }
}

/**
 * Get validated environment (validates on first call)
 */
export function getEnv(): Env {
  if (!cachedEnv) {
    return validateEnv();
  }
  return cachedEnv;
}
