import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/db/products";
import { formatPaise } from "@/lib/utils/format";
import type { Database } from "@/types/database.types";
import { CustomizeForm } from "@/components/storefront/customize-form";

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        
        {/* Left Column: Product Details & Sticky Image */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="sticky top-24">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted shadow-xl shadow-primary/10 ring-1 ring-white/60">
              {product.image_url && (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              )}
            </div>
            
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                {TYPE_LABELS[product.type]}
              </p>
              <h1 className="mt-2 font-serif text-3xl font-bold text-primary sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {product.description}
              </p>
              <p className="mt-6 text-2xl font-bold gradient-text">
                {formatPaise(product.price_paise)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Upload Zone / Customize Form */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-secondary bg-white p-6 sm:p-10 shadow-sm">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-primary mb-2">
              Personalize your {product.name}
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Upload your photo and video — nothing is lost if you leave and come
              back.
            </p>
            
            <CustomizeForm productId={product.id} />
          </div>
        </div>

      </div>
    </div>
  );
}
