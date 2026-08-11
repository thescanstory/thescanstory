import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateCustomer } from "@/lib/db/customers";
import { createOrder } from "@/lib/db/orders";
import {
  moveOrderMediaToActiveBucket,
  reparentSessionMediaToOrder,
} from "@/lib/db/media-assets";
import { reparentSessionMessageToOrder } from "@/lib/db/messages";
import { shippingSchema } from "@/lib/validation/schemas";
import { isPaymentsConfigured, verifyRazorpaySignature } from "@/lib/payments/razorpay";
import { withIdempotency } from "@/lib/idempotency";
import { logger } from "@/lib/logger";
import type { PaymentMethod, PaymentStatus } from "@/types/database.types";

const COD_HANDLING_FEE_PAISE = Number(process.env.COD_HANDLING_FEE_PAISE ?? 4900);

async function isCodVerified(sessionId: string, phone: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("otp_codes")
    .select("id")
    .eq("session_id", sessionId)
    .eq("phone", phone)
    .eq("verified", true)
    .limit(1)
    .maybeSingle();
  return !!data;
}

export async function POST(request: Request) {
  try {
    const result = await withIdempotency(request, async () => {
      const body = await request.json();
      const {
        sessionId,
        productId,
        paymentMethod,
        shipping,
        razorpay,
      } = body as {
        sessionId: string;
        productId: string;
        paymentMethod: PaymentMethod;
        shipping: unknown;
        razorpay?: { orderId: string; paymentId: string; signature: string };
      };

      const parsedShipping = shippingSchema.safeParse(shipping);
      if (!sessionId || !productId || !parsedShipping.success) {
        return NextResponse.json(
          { error: parsedShipping.success ? "Missing fields" : parsedShipping.error.issues[0]?.message },
          { status: 400 }
        );
      }
      const { name, addressLine, city, pin, phone, email } = parsedShipping.data;

      let paymentStatus: PaymentStatus = "unpaid";
      let codVerified = false;
      let razorpayOrderId: string | null = null;
      let razorpayPaymentId: string | null = null;
      let codHandlingFeePaise = 0;

      if (paymentMethod === "cod") {
        codVerified = await isCodVerified(sessionId, phone);
        if (!codVerified) {
          return NextResponse.json(
            { error: "Phone number is not OTP-verified" },
            { status: 400 }
          );
        }
        codHandlingFeePaise = COD_HANDLING_FEE_PAISE;
      } else if (paymentMethod === "online") {
        if (isPaymentsConfigured()) {
          if (!razorpay) {
            return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
          }
          const valid = verifyRazorpaySignature({
            orderId: razorpay.orderId,
            paymentId: razorpay.paymentId,
            signature: razorpay.signature,
          });
          if (!valid) {
            return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
          }
          paymentStatus = "paid";
          razorpayOrderId = razorpay.orderId;
          razorpayPaymentId = razorpay.paymentId;
        } else {
          // Simulated payment (no real Razorpay keys configured yet).
          paymentStatus = "paid";
        }
      }

      const customer = await findOrCreateCustomer({ name, email, phone });

      const order = await createOrder({
        sessionId,
        customerId: customer.id,
        productId,
        paymentMethod,
        paymentStatus,
        codVerified,
        codHandlingFeePaise,
        shippingAddress: { name, addressLine, city, pin },
        phone,
        email,
        razorpayOrderId,
        razorpayPaymentId,
      });

      await reparentSessionMediaToOrder(sessionId, order.id);
      await reparentSessionMessageToOrder(sessionId, order.id);
      await moveOrderMediaToActiveBucket(order.id);

      logger.info("Order created", { orderId: order.id, productId, paymentMethod, paymentStatus });

      return NextResponse.json({
        orderId: order.id,
        experienceSlug: order.experience_slug,
      });
    });

    return result.response;
  } catch (error) {
    logger.error("Error creating order", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
