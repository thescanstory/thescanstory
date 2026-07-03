import Link from "next/link";
import { listOrders } from "@/lib/db/orders";
import { OrderFilters } from "@/components/admin/order-filters";
import { OrdersTable } from "@/components/admin/orders-table";
import { Button } from "@/components/ui/button";
import type { OrderStatus, PaymentMethod } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; paymentMethod?: string; page?: string };
}) {
  const page = Number(searchParams.page ?? 1);
  const { orders, total, pageSize } = await listOrders({
    status: searchParams.status as OrderStatus | undefined,
    paymentMethod: searchParams.paymentMethod as PaymentMethod | undefined,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="gradient-text font-serif text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </div>

      <OrderFilters status={searchParams.status} paymentMethod={searchParams.paymentMethod} />

      <OrdersTable
        orders={orders.map((o) => ({
          ...o,
          products: Array.isArray(o.products) ? o.products[0] ?? null : o.products,
        }))}
      />

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} asChild variant={p === page ? "default" : "outline"} size="sm">
              <Link
                href={`/admin/orders?${new URLSearchParams({
                  ...(searchParams.status ? { status: searchParams.status } : {}),
                  ...(searchParams.paymentMethod
                    ? { paymentMethod: searchParams.paymentMethod }
                    : {}),
                  page: String(p),
                }).toString()}`}
              >
                {p}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
