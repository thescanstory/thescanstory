import { NextResponse } from "next/server";
import { sendOtp } from "@/lib/otp/otp";
import { shippingSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, phone } = body as { sessionId: string; phone: string };

  const parsedPhone = shippingSchema.shape.phone.safeParse(phone);
  if (!sessionId || !parsedPhone.success) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  await sendOtp({ sessionId, phone: parsedPhone.data });
  return NextResponse.json({ ok: true });
}
