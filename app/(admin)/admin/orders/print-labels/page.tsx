import { getOrdersByIds } from "@/lib/db/orders";
import { PrintButton } from "@/components/admin/print-button";

type ShippingAddress = {
  name?: string;
  addressLine?: string;
  city?: string;
  pin?: string;
};

export default async function PrintLabelsPage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const ids = searchParams.ids?.split(",").filter(Boolean) ?? [];
  const orders = ids.length ? await getOrdersByIds(ids) : [];

  return (
    <div className="bg-white text-black">
      <div className="print:hidden mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {orders.length} label{orders.length === 1 ? "" : "s"} — use your
          browser&apos;s print dialog, then cut along the borders.
        </p>
        <PrintButton />
      </div>

      {orders.length === 0 && (
        <p className="print:hidden text-sm text-muted-foreground">
          No orders selected.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-0">
        {orders.map((order) => {
          const address = (order.shipping_address ?? {}) as ShippingAddress;
          const product = Array.isArray(order.products)
            ? order.products[0]
            : order.products;

          return (
            <div
              key={order.id}
              className="break-inside-avoid rounded-lg border-2 border-black p-4 print:m-2 print:rounded-none"
            >
              <p className="text-lg font-semibold">{address.name ?? "—"}</p>
              <p className="mt-1 text-sm">{address.addressLine ?? "—"}</p>
              <p className="text-sm">
                {address.city ?? "—"} {address.pin ? `- ${address.pin}` : ""}
              </p>
              <p className="mt-2 text-sm font-medium">{order.phone}</p>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-black pt-2 text-xs">
                <span>{product?.name ?? ""}</span>
                <span className="font-mono">{order.id.slice(0, 8)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
