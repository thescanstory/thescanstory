import { getProducts } from "@/lib/db/products";
import { ProductCard } from "@/components/storefront/product-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
          A physical object that comes to life
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground sm:max-w-none sm:text-base">
          Point your phone at the printed photo and watch your story play.
          No app, no QR code — just scan.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
