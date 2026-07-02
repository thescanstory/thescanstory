import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db/orders";
import type { OrderStatus } from "@/types/database.types";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "cod_pending",
  "shipped",
  "delivered",
];

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { status } = (await request.json()) as { status: OrderStatus };
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await updateOrderStatus(params.id, status);
  return NextResponse.json({ order });
}
