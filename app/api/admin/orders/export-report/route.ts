import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import Papa from "papaparse";
import { format } from "date-fns";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, products(name, price_paise)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!orders || orders.length === 0) {
    return NextResponse.json({ error: "No orders found" }, { status: 404 });
  }

  // Aggregate stats per product and payment method
  const reportRows = orders.map(order => {
    const product = Array.isArray(order.products) ? order.products[0] : order.products;
    const revenuePaise = (product?.price_paise ?? 0) + (order.cod_handling_fee_paise ?? 0);
    
    return {
      "Order ID": order.id,
      "Date": format(new Date(order.created_at), "yyyy-MM-dd HH:mm:ss"),
      "Product": product?.name ?? "Unknown",
      "Status": order.status,
      "Payment Method": order.payment_method.toUpperCase(),
      "Payment Status": order.payment_status.toUpperCase(),
      "Revenue (INR)": (revenuePaise / 100).toFixed(2),
      "Customer Email": order.email,
    };
  });

  const csv = Papa.unparse(reportRows);

  const timestamp = format(new Date(), "yyyyMMdd-HHmm");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="financial_report_${timestamp}.csv"`,
    },
  });
}
