import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getOrderById } from "@/lib/db/orders";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: { orderId: string };
}) {
  const order = await getOrderById(params.orderId);
  if (!order) notFound();

  const total = order.products
    ? order.products.price_paise + order.cod_handling_fee_paise
    : order.cod_handling_fee_paise;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center sm:py-16">
      <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
      <h1 className="mt-4 font-serif text-xl font-semibold sm:text-2xl">
        Order placed — thank you!
      </h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        The Scan Story is now printing your {order.products?.name ?? "item"}.
        We&apos;ll send you the scan link by email/SMS once it ships.
      </p>

      <div className="mt-6 space-y-1 rounded-lg border bg-card p-5 text-left sm:mt-8 sm:p-6">
        <p className="text-sm text-muted-foreground">Order ID</p>
        <p className="break-all font-mono text-sm">{order.id}</p>
        <div className="mt-4 flex justify-between text-sm">
          <span>{order.products?.name}</span>
          <span>{formatPaise(total)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Payment method</span>
          <span>{order.payment_method === "cod" ? "Cash on Delivery" : "Online"}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Status</span>
          <span className="capitalize">{order.status.replace("_", " ")}</span>
        </div>
      </div>

      <Button asChild className="mt-6 w-full sm:mt-8 sm:w-auto">
        <Link href="/">Back to shop</Link>
      </Button>
    </div>
  );
}
