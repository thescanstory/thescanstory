"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Download, FileArchive, Printer, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils/format";
import type { OrderStatus, PaymentMethod } from "@/types/database.types";

type OrderRow = {
  id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  email: string;
  phone: string;
  experience_slug: string;
  created_at: string;
  cod_handling_fee_paise: number;
  products: { name: string; type: string; price_paise?: number } | null;
};

const STATUS_VARIANT: Record<OrderStatus, string> = {
  pending: "secondary",
  paid: "default",
  cod_pending: "secondary",
  shipped: "default",
  delivered: "default",
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const allSelected = orders.length > 0 && selected.size === orders.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleExportCsv() {
    setPending(true);
    const res = await fetch("/api/admin/orders/export-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setPending(false);
    if (!res.ok) return toast.error("Failed to export CSV");
    downloadBlob(await res.blob(), "scan-story-orders.csv");
  }

  async function handleExportZip() {
    setPending(true);
    const res = await fetch("/api/admin/orders/export-zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setPending(false);
    if (!res.ok) return toast.error("Failed to export photos");
    downloadBlob(await res.blob(), "scan-story-photos.zip");
  }

  async function handleMarkShipped() {
    setPending(true);
    const res = await fetch("/api/admin/orders/mark-shipped", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setPending(false);
    if (!res.ok) return toast.error("Failed to mark as shipped");
    const { links } = (await res.json()) as {
      links: { orderId: string; experienceUrl: string }[];
    };
    toast.success(
      `Marked ${links.length} order(s) as shipped — experience link(s) sent (see server console)`
    );
    setSelected(new Set());
    window.location.reload();
  }

  function handlePrintLabels() {
    window.open(`/admin/orders/print-labels?ids=${[...selected].join(",")}`, "_blank");
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/experience/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Experience link copied");
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur">
          <p className="mr-2 text-sm text-muted-foreground">
            {selected.size} selected
          </p>
          <Button size="sm" variant="outline" disabled={pending} onClick={handleExportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={handleExportZip}>
            <FileArchive className="mr-1.5 h-3.5 w-3.5" />
            Download Photos (ZIP)
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={handlePrintLabels}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print Labels
          </Button>
          <Button size="sm" disabled={pending} onClick={handleMarkShipped}>
            <Truck className="mr-1.5 h-3.5 w-3.5" />
            Mark as Shipped
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-lg shadow-primary/5 backdrop-blur">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Experience link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Checkbox
                  checked={selected.has(order.id)}
                  onCheckedChange={() => toggleOne(order.id)}
                />
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-mono text-xs underline underline-offset-2"
                >
                  {order.id.slice(0, 8)}
                </Link>
              </TableCell>
              <TableCell className="text-sm">
                <div>{order.email}</div>
                <div className="text-muted-foreground">{order.phone}</div>
              </TableCell>
              <TableCell className="text-sm">{order.products?.name}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[order.status] as "default" | "secondary"}>
                  {order.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-sm capitalize">
                {order.payment_method}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(order.created_at)}
              </TableCell>
              <TableCell>
                <Button size="sm" variant="ghost" onClick={() => copyLink(order.experience_slug)}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
