import Link from "next/link";
import { listOrders, getDashboardMetrics } from "@/lib/db/orders";
import { OrderFilters } from "@/components/admin/order-filters";
import { OrdersTable } from "@/components/admin/orders-table";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/utils/format";
import type { OrderStatus, PaymentMethod } from "@/types/database.types";
import { Package, TrendingUp, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; paymentMethod?: string; page?: string };
}) {
  const page = Number(searchParams.page ?? 1);
  const [{ orders, total, pageSize }, metrics] = await Promise.all([
    listOrders({
      status: searchParams.status as OrderStatus | undefined,
      paymentMethod: searchParams.paymentMethod as PaymentMethod | undefined,
      page,
    }),
    getDashboardMetrics(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="gradient-text font-serif text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Package className="h-5 w-5" />
            <h2 className="text-sm font-medium">Orders Today</h2>
          </div>
          <p className="text-3xl font-bold">{metrics.totalOrdersToday}</p>
        </div>
        <div className="rounded-xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-sm font-medium">Revenue Today</h2>
          </div>
          <p className="text-3xl font-bold text-primary">{formatPaise(metrics.revenueTodayPaise)}</p>
        </div>
        <div className="rounded-xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Clock className="h-5 w-5" />
            <h2 className="text-sm font-medium">Pending Fulfillment</h2>
          </div>
          <p className="text-3xl font-bold">{metrics.pendingFulfillmentCount}</p>
        </div>
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
