import { NextResponse } from "next/server";
import { findUnprintableOrders } from "@/lib/db/orders";
import { logger } from "@/lib/logger";
import { Resend } from "resend";

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

  try {
    const unprintableOrders = await findUnprintableOrders();
    
    if (unprintableOrders.length > 0) {
      const resend = new Resend(process.env.RESEND_API_KEY!);
      const adminEmail = process.env.ADMIN_EMAIL ?? "admin@thescanstory.com";
      
      const html = `
        <h2>Daily Unprintable Orders Report</h2>
        <p>Found ${unprintableOrders.length} orders that have been pending for over 24 hours.</p>
        <ul>
          ${unprintableOrders.map(o => `<li>Order ID: ${o.id} - Customer: ${o.customers?.name ?? 'Unknown'} - Payment: ${o.payment_method} (${o.payment_status})</li>`).join("")}
        </ul>
      `;

      await resend.emails.send({
        from: "The Scan Story <onboarding@resend.dev>",
        to: adminEmail,
        subject: `[Action Required] ${unprintableOrders.length} Unprintable Orders`,
        html,
      });
      
      logger.info(`Sent unprintable orders report for ${unprintableOrders.length} orders`);
    } else {
      logger.info("No unprintable orders found today");
    }

    return NextResponse.json({ processed: unprintableOrders.length });
  } catch (err) {
    logger.error("Failed to process unprintable orders", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
