import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ordersToShippingCsv } from "@/lib/utils/csv";

export async function POST(request: Request) {
  const { ids } = (await request.json()) as { ids: string[] };
  if (!ids?.length) {
    return NextResponse.json({ error: "No orders selected" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, phone, shipping_address, products(name)")
    .in("id", ids);

  if (error || !data) {
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }

  const csv = ordersToShippingCsv(
    data.map((o) => ({
      ...o,
      products: Array.isArray(o.products) ? o.products[0] ?? null : o.products,
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="scan-story-orders.csv"`,
    },
  });
}
