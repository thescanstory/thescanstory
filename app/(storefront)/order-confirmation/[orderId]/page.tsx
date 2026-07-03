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
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-glow">
        <CheckCircle2 className="h-9 w-9 text-white" />
      </div>
      <h1 className="mt-5 font-serif text-xl font-semibold sm:text-2xl">
        Order placed — thank you!
      </h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        The Scan Story is now printing your {order.products?.name ?? "item"}.
        We&apos;ll send you the scan link by email/SMS once it ships.
      </p>

      <div className="mt-6 space-y-1 rounded-2xl border border-white/60 bg-white/70 p-5 text-left shadow-lg shadow-primary/10 backdrop-blur sm:mt-8 sm:p-6">
        <p className="text-sm text-muted-foreground">Order ID</p>
        <p className="break-all font-mono text-sm">{order.id}</p>
        <div className="mt-4 flex justify-between text-sm">
          <span>{order.products?.name}</span>
          <span className="font-semibold">{formatPaise(total)}</span>
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
