import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/db/products";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/utils/format";
import type { Database } from "@/types/database.types";

const TYPE_LABELS: Record<
  Database["public"]["Tables"]["products"]["Row"]["type"],
  string
> = {
  frame: "Photo Frame",
  wallet_card: "Wallet Card",
  tshirt: "T-Shirt",
};

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductById(params.id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-12">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-xl shadow-primary/10 ring-1 ring-white/60">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {TYPE_LABELS[product.type]}
          </p>
          <h1 className="mt-1 font-serif text-xl font-semibold sm:text-2xl">
            {product.name}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
            {product.description}
          </p>
          <p className="gradient-text mt-5 text-xl font-semibold sm:mt-6 sm:text-2xl">
            {formatPaise(product.price_paise)}
          </p>
          <Button asChild size="lg" className="mt-6 w-full sm:mt-8 sm:w-auto">
            <Link href={`/customize/${product.id}`}>Personalize This</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
