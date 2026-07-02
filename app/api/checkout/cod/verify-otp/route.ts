import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp/otp";
import { otpVerifySchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, ...rest } = body as { sessionId: string; phone: string; code: string };

  const parsed = otpVerifySchema.safeParse(rest);
  if (!sessionId || !parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const verified = await verifyOtp({ sessionId, ...parsed.data });
  if (!verified) {
    return NextResponse.json({ error: "Incorrect or expired code" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
