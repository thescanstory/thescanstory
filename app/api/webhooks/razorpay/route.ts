import { NextResponse } from "next/server";
import { getOrderByRazorpayOrderId, markOrderPaid } from "@/lib/db/orders";
import { isWebhookConfigured, verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";
import { sendOrderPlacedNotification } from "@/lib/notify/notify";

// Reconciles payments that the client never got to confirm (tab closed,
// network drop between Razorpay's redirect and our /checkout/confirm call).
// Signature must be verified against the raw request body — reading
// request.json() first would re-serialize it and break the HMAC.
export async function POST(request: Request) {
  if (!isWebhookConfigured()) {
    console.warn("[RAZORPAY WEBHOOK] Received event but RAZORPAY_WEBHOOK_SECRET is not set — rejecting.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as {
    event: string;
    payload?: { payment?: { entity?: { id: string; order_id: string } } };
  };

  if (payload.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const payment = payload.payload?.payment?.entity;
  if (!payment?.order_id) {
    return NextResponse.json({ received: true });
  }

  const order = await getOrderByRazorpayOrderId(payment.order_id);
  if (!order) {
    // /checkout/confirm hasn't run yet (or never will). We can't safely
    // create the order here — shipping address, product, and uploaded
    // media all live client-side until that call lands. Log for manual
    // reconciliation rather than silently dropping the payment.
    console.warn(
      `[RAZORPAY WEBHOOK] payment.captured for unknown razorpay_order_id=${payment.order_id}, payment_id=${payment.id} — no matching order yet.`
    );
    return NextResponse.json({ received: true });
  }

  if (order.payment_status !== "paid") {
    await markOrderPaid({ orderId: order.id, razorpayPaymentId: payment.id });
    
    // Dispatch order confirmed notification
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://thescanstory.com";
    const trackUrl = `${appUrl}/order-confirmation/${order.id}`;
    const address = (order.shipping_address ?? {}) as { name?: string };
    
    await sendOrderPlacedNotification({
      email: order.email,
      phone: order.phone,
      orderId: order.id,
      trackUrl,
      customerName: address.name,
    });
  }

  return NextResponse.json({ received: true });
}
