import { NextResponse } from "next/server";
import { upsertSessionMessage } from "@/lib/db/messages";
import { messageSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const body = await request.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message" },
      { status: 400 }
    );
  }

  const message = await upsertSessionMessage(
    params.sessionId,
    parsed.data.textContent
  );
  return NextResponse.json({ message });
}
