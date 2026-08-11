import { NextResponse } from "next/server";
import { findOrdersNeedingReminder } from "@/lib/db/orders";
import { sendReminderNotification } from "@/lib/notify/notify";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://thescanstory.com";
  let processed = 0;

  try {
    const orders = await findOrdersNeedingReminder();
    
    for (const order of orders) {
      const address = (order.shipping_address ?? {}) as { name?: string };
      const experienceUrl = `${appUrl}/experience/${order.experience_slug}`;
      
      await sendReminderNotification({
        email: order.email,
        phone: order.phone,
        experienceUrl,
        customerName: address.name,
      });
      processed++;
    }

    logger.info(`Sent ${processed} reminders via cron`);
    return NextResponse.json({ processed });
  } catch (err) {
    logger.error("Failed to send reminders", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
