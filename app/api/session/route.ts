import { NextResponse } from "next/server";
import { createSession } from "@/lib/db/sessions";

export async function POST() {
  const session = await createSession();
  return NextResponse.json({ sessionId: session.id });
}
