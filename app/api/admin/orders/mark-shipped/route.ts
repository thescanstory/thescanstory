import { NextResponse } from "next/server";
import { markOrdersShipped } from "@/lib/db/orders";
import { sendShippedNotification } from "@/lib/notify/notify";
import { isAdminAuthenticated } from "@/lib/auth/require-admin";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids } = (await request.json()) as { ids: string[] };
  if (!ids?.length) {
    return NextResponse.json({ error: "No orders selected" }, { status: 400 });
  }

  const orders = await markOrdersShipped(ids);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const links = await Promise.all(
    orders.map(async (order) => {
      const experienceUrl = `${appUrl}/experience/${order.experience_slug}`;
      const address = (order.shipping_address ?? {}) as { name?: string };
      await sendShippedNotification({
        email: order.email,
        phone: order.phone,
        experienceUrl,
        customerName: address.name,
      });
      return { orderId: order.id, experienceUrl };
    })
  );

  return NextResponse.json({ links });
}
