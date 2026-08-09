import { NextResponse } from "next/server";
import { findAbandonedSessionIds, purgeAbandonedSession } from "@/lib/db/cleanup";

export const maxDuration = 60;

// Vercel automatically adds this header when CRON_SECRET is set on the
// project — see https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// Triggered daily by vercel.json's cron config. Deletes uploaded files and
// DB rows for sessions that never converted to an order, past
// ABANDONED_SESSION_TTL_HOURS — otherwise uploads-temp grows forever with
// carts nobody finished.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionIds = await findAbandonedSessionIds();

  let purged = 0;
  for (const id of sessionIds) {
    try {
      await purgeAbandonedSession(id);
      purged++;
    } catch (err) {
      console.error(`[CLEANUP] Failed to purge session ${id}:`, err);
    }
  }

  return NextResponse.json({ found: sessionIds.length, purged });
}
