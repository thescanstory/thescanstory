import type { ShippingInput } from "@/lib/validation/schemas";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

// Pre-filled shipping used by both the checkout page's "Skip Checkout
// (Demo)" button and the customize page's "Preview AR" button — same
// dummy address either way, so a stray demo order is easy to recognize
// in the admin orders list.
export const DEMO_SHIPPING: ShippingInput = {
  name: "Demo Customer",
  addressLine: "221B Baker Street",
  city: "Mumbai",
  pin: "400001",
  phone: "9876543210",
  email: "demo@example.com",
};

async function finalizeOrder(params: {
  sessionId: string | null;
  productId: string;
  paymentMethod: "online" | "cod";
  shipping: ShippingInput;
  razorpay?: { orderId: string; paymentId: string; signature: string };
}): Promise<{ orderId: string; experienceSlug: string } | { error: string }> {
  const res = await fetch("/api/checkout/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body.error ?? "Something went wrong placing your order" };
  }

  return (await res.json()) as { orderId: string; experienceSlug: string };
}

// Goes through the exact same create-order -> confirm endpoints as a real
// online checkout, just with the shipping data supplied by the caller —
// never bypasses payment itself. While Razorpay is unconfigured (mock
// mode, the current state) this resolves in about a second; the moment
// real keys are added, data.mode stops being "mock" and this opens the
// real Razorpay modal instead, same as any other order.
export async function submitOnlineOrder(params: {
  sessionId: string | null;
  productId: string;
  shipping: ShippingInput;
  onMockDelay?: () => void;
}): Promise<{ orderId: string; experienceSlug: string } | { error: string }> {
  const res = await fetch("/api/checkout/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: params.productId }),
  });
  const data = await res.json();

  if (data.mode === "mock") {
    params.onMockDelay?.();
    await new Promise((r) => setTimeout(r, 1500));
    return finalizeOrder({
      sessionId: params.sessionId,
      productId: params.productId,
      paymentMethod: "online",
      shipping: params.shipping,
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amountPaise,
        currency: "INR",
        name: "Scan Story",
        order_id: data.razorpayOrderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          resolve(
            await finalizeOrder({
              sessionId: params.sessionId,
              productId: params.productId,
              paymentMethod: "online",
              shipping: params.shipping,
              razorpay: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            })
          );
        },
        modal: {
          ondismiss: () => resolve({ error: "Payment cancelled" }),
        },
      });
      rzp.open();
    };
    document.body.appendChild(script);
  });
}

export { finalizeOrder };
