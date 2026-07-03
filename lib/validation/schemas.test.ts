import { describe, expect, it } from "vitest";
import { messageSchema, otpVerifySchema, shippingSchema } from "./schemas";

describe("shippingSchema", () => {
  const valid = {
    name: "Jane Doe",
    addressLine: "42 MG Road, Apt 3B",
    city: "Bengaluru",
    pin: "560001",
    phone: "9876543210",
    email: "jane@example.com",
  };

  it("accepts a fully valid shipping address", () => {
    expect(shippingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a PIN code that isn't exactly 6 digits", () => {
    const result = shippingSchema.safeParse({ ...valid, pin: "5600" });
    expect(result.success).toBe(false);
  });

  it("rejects a phone number that doesn't start with 6-9", () => {
    const result = shippingSchema.safeParse({ ...valid, phone: "1234567890" });
    expect(result.success).toBe(false);
  });

  it("rejects a phone number with the wrong length", () => {
    const result = shippingSchema.safeParse({ ...valid, phone: "98765" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = shippingSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from string fields", () => {
    const result = shippingSchema.safeParse({ ...valid, name: "  Jane Doe  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Jane Doe");
  });

  it("rejects a name that's too short", () => {
    const result = shippingSchema.safeParse({ ...valid, name: "J" });
    expect(result.success).toBe(false);
  });
});

describe("messageSchema", () => {
  it("accepts a short message", () => {
    expect(messageSchema.safeParse({ textContent: "Happy birthday!" }).success).toBe(true);
  });

  it("rejects an empty message", () => {
    expect(messageSchema.safeParse({ textContent: "" }).success).toBe(false);
  });

  it("rejects a message over 1000 characters", () => {
    const result = messageSchema.safeParse({ textContent: "a".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 1000 characters", () => {
    const result = messageSchema.safeParse({ textContent: "a".repeat(1000) });
    expect(result.success).toBe(true);
  });
});

describe("otpVerifySchema", () => {
  it("accepts a valid phone + 6-digit code", () => {
    expect(otpVerifySchema.safeParse({ phone: "9876543210", code: "123456" }).success).toBe(true);
  });

  it("rejects a code that isn't 6 digits", () => {
    expect(otpVerifySchema.safeParse({ phone: "9876543210", code: "12345" }).success).toBe(false);
  });

  it("rejects a non-numeric code", () => {
    expect(otpVerifySchema.safeParse({ phone: "9876543210", code: "abcdef" }).success).toBe(false);
  });
});
