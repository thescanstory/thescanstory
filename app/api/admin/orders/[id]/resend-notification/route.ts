import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db/orders";
import { sendShippedNotification } from "@/lib/notify/notify";

// Lets admin re-trigger the shipped-notification email without touching
// order status — for a bounced/lost email, a customer who never got the
// link, or testing the notification pipeline against a real order.
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const order = await getOrderById(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const experienceUrl = `${appUrl}/experience/${order.experience_slug}`;
  const address = (order.shipping_address ?? {}) as { name?: string };

  await sendShippedNotification({
    email: order.email,
    phone: order.phone,
    experienceUrl,
    customerName: address.name,
  });

  return NextResponse.json({ experienceUrl });
}
