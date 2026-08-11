import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const healthcheck = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: "unknown",
        environment: "unknown",
      },
    };

    // Check database connectivity
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from("products").select("count").limit(1);
      
      if (error) {
        healthcheck.checks.database = "unhealthy";
        healthcheck.status = "degraded";
        logger.error("Health check: database connection failed", error);
      } else {
        healthcheck.checks.database = "healthy";
      }
    } catch (error) {
      healthcheck.checks.database = "unhealthy";
      healthcheck.status = "degraded";
      logger.error("Health check: database error", error);
    }

    // Check environment variables
    try {
      const requiredEnvVars = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "ADMIN_EMAIL",
        "NEXT_PUBLIC_APP_URL",
      ];

      const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);
      
      if (missing.length > 0) {
        healthcheck.checks.environment = `missing: ${missing.join(", ")}`;
        healthcheck.status = "degraded";
        logger.warn("Health check: missing environment variables", { missing });
      } else {
        healthcheck.checks.environment = "healthy";
      }
    } catch (error) {
      healthcheck.checks.environment = "error";
      logger.error("Health check: environment check failed", error);
    }

    const statusCode = healthcheck.status === "healthy" ? 200 : 503;
    return NextResponse.json(healthcheck, { status: statusCode });
  } catch (error) {
    logger.error("Health check failed", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 503 }
    );
  }
}
