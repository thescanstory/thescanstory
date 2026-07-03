import Link from "next/link";
import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentMethod } from "@/types/database.types";

const STATUSES: { label: string; value: OrderStatus }[] = [
  { label: "Paid", value: "paid" },
  { label: "COD Pending", value: "cod_pending" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
];

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Online", value: "online" },
  { label: "COD", value: "cod" },
];

function buildHref(current: {
  status?: string;
  paymentMethod?: string;
}, updates: Record<string, string | undefined>) {
  const params = new URLSearchParams({ ...current, ...updates } as Record<string, string>);
  Object.entries(updates).forEach(([key, value]) => {
    if (!value) params.delete(key);
  });
  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export function OrderFilters({
  status,
  paymentMethod,
}: {
  status?: string;
  paymentMethod?: string;
}) {
  const current = { status, paymentMethod };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <FilterGroup
        label="Status"
        activeValue={status}
        options={STATUSES}
        current={current}
        paramKey="status"
      />
      <div className="mx-2 h-5 w-px bg-border" />
      <FilterGroup
        label="Payment"
        activeValue={paymentMethod}
        options={PAYMENT_METHODS}
        current={current}
        paramKey="paymentMethod"
      />
    </div>
  );
}

function FilterGroup({
  label,
  activeValue,
  options,
  current,
  paramKey,
}: {
  label: string;
  activeValue?: string;
  options: { label: string; value: string }[];
  current: { status?: string; paymentMethod?: string };
  paramKey: "status" | "paymentMethod";
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <Link
        href={buildHref(current, { [paramKey]: undefined })}
        className={cn(
          "rounded-full border px-3 py-1 text-xs transition-all",
          !activeValue
            ? "border-primary bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-sm"
            : "hover:border-primary/40 hover:bg-accent/5"
        )}
      >
        All
      </Link>
      {options.map((opt) => (
        <Link
          key={opt.value}
          href={buildHref(current, { [paramKey]: opt.value })}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-all",
            activeValue === opt.value
              ? "border-primary bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-sm"
              : "hover:border-primary/40 hover:bg-accent/5"
          )}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
