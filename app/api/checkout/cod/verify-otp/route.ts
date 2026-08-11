import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp/otp";
import { otpVerifySchema } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, ...rest } = body as { sessionId: string; phone: string; code: string };

    const parsed = otpVerifySchema.safeParse(rest);
    if (!sessionId || !parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const verified = await verifyOtp({ sessionId, ...parsed.data });
    if (!verified) {
      logger.warn("Invalid OTP attempt", { phone: parsed.data.phone, sessionId });
      return NextResponse.json({ error: "Incorrect or expired code" }, { status: 400 });
    }

    logger.info("OTP verified successfully", { phone: parsed.data.phone, sessionId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Error verifying OTP", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
