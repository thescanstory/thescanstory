import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db/orders";
import { isAdminAuthenticated } from "@/lib/auth/require-admin";
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
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = (await request.json()) as { status: OrderStatus };
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await updateOrderStatus(params.id, status);
  return NextResponse.json({ order });
}
