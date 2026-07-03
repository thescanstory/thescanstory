import Razorpay from "razorpay";
import crypto from "crypto";

const PLACEHOLDER_MARKERS = ["", "rzp_test_xxxxxxxxxxxx"];

// True once real test/live keys are dropped into env vars. Until then,
// checkout runs in a clearly-labeled simulated mode — no code changes
// needed to "graduate" to real payments later, just set the two env vars.
export function isPaymentsConfigured() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return (
    keyId.startsWith("rzp_") &&
    !PLACEHOLDER_MARKERS.includes(keyId) &&
    keySecret.length > 0
  );
}

function getClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function createRazorpayOrder(amountPaise: number, receipt: string) {
  const client = getClient();
  return client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
  });
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  return expected === params.signature;
}

// Separate secret from the API key/secret pair — set under Settings ->
// Webhooks in the Razorpay dashboard when the webhook URL is registered.
export function isWebhookConfigured() {
  return (process.env.RAZORPAY_WEBHOOK_SECRET ?? "").length > 0;
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string) {
  return Razorpay.validateWebhookSignature(
    rawBody,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET!
  );
}
