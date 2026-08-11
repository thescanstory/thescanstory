import { NextResponse } from "next/server";
import { sendOtp } from "@/lib/otp/otp";
import { shippingSchema } from "@/lib/validation/schemas";
import { otpRateLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = await otpRateLimiter.check(identifier);

    if (!rateLimit.allowed) {
      logger.warn("OTP rate limit exceeded", { identifier });
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const { sessionId, phone } = body as { sessionId: string; phone: string };

    const parsedPhone = shippingSchema.shape.phone.safeParse(phone);
    if (!sessionId || !parsedPhone.success) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    await sendOtp({ sessionId, phone: parsedPhone.data });
    logger.info("OTP sent", { phone: parsedPhone.data, sessionId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Error sending OTP", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
