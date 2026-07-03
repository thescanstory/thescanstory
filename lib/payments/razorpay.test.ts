import crypto from "crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  isPaymentsConfigured,
  isWebhookConfigured,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "./razorpay";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("isPaymentsConfigured", () => {
  it("is false when key id is empty", () => {
    process.env.RAZORPAY_KEY_ID = "";
    process.env.RAZORPAY_KEY_SECRET = "somesecret";
    expect(isPaymentsConfigured()).toBe(false);
  });

  it("is false for the placeholder key id, even with a secret set", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_xxxxxxxxxxxx";
    process.env.RAZORPAY_KEY_SECRET = "somesecret";
    expect(isPaymentsConfigured()).toBe(false);
  });

  it("is false when the secret is missing, even with a real-looking key id", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_realkey123";
    process.env.RAZORPAY_KEY_SECRET = "";
    expect(isPaymentsConfigured()).toBe(false);
  });

  it("is true once both a real-looking key id and a secret are set", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_realkey123";
    process.env.RAZORPAY_KEY_SECRET = "somesecret";
    expect(isPaymentsConfigured()).toBe(true);
  });
});

describe("verifyRazorpaySignature", () => {
  it("accepts a signature computed the same way the client would produce it", () => {
    process.env.RAZORPAY_KEY_SECRET = "test_secret";
    const orderId = "order_ABC123";
    const paymentId = "pay_XYZ789";
    const signature = crypto
      .createHmac("sha256", "test_secret")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(verifyRazorpaySignature({ orderId, paymentId, signature })).toBe(true);
  });

  it("rejects a tampered signature", () => {
    process.env.RAZORPAY_KEY_SECRET = "test_secret";
    expect(
      verifyRazorpaySignature({
        orderId: "order_ABC123",
        paymentId: "pay_XYZ789",
        signature: "0".repeat(64),
      })
    ).toBe(false);
  });

  it("rejects a signature computed with the wrong secret", () => {
    const orderId = "order_ABC123";
    const paymentId = "pay_XYZ789";
    const signature = crypto
      .createHmac("sha256", "wrong_secret")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    process.env.RAZORPAY_KEY_SECRET = "test_secret";
    expect(verifyRazorpaySignature({ orderId, paymentId, signature })).toBe(false);
  });
});

describe("isWebhookConfigured", () => {
  it("is false when unset", () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    expect(isWebhookConfigured()).toBe(false);
  });

  it("is false when blank", () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "";
    expect(isWebhookConfigured()).toBe(false);
  });

  it("is true once a secret is set", () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
    expect(isWebhookConfigured()).toBe(true);
  });
});

describe("verifyRazorpayWebhookSignature", () => {
  it("accepts a signature computed the same way Razorpay would produce it", () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = crypto.createHmac("sha256", "whsec_test").update(body).digest("hex");

    expect(verifyRazorpayWebhookSignature(body, signature)).toBe(true);
  });

  it("rejects a body that was tampered with after signing", () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
    const originalBody = JSON.stringify({ event: "payment.captured" });
    const signature = crypto.createHmac("sha256", "whsec_test").update(originalBody).digest("hex");
    const tamperedBody = JSON.stringify({ event: "payment.refunded" });

    expect(verifyRazorpayWebhookSignature(tamperedBody, signature)).toBe(false);
  });
});
