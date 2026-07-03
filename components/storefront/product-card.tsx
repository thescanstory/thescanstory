import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatPaise } from "@/lib/utils/format";
import type { Database } from "@/types/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];

const TYPE_LABELS: Record<Product["type"], string> = {
  frame: "Photo Frame",
  wallet_card: "Wallet Card",
  tshirt: "T-Shirt",
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className="p-3 sm:p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-accent sm:text-xs">
            {TYPE_LABELS[product.type]}
          </p>
          <h3 className="mt-0.5 text-sm font-medium sm:text-base">{product.name}</h3>
          <p className="mt-1.5 gradient-text font-semibold sm:mt-2">{formatPaise(product.price_paise)}</p>
        </div>
      </Card>
    </Link>
  );
}
