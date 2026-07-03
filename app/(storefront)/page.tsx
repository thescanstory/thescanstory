import { getProducts } from "@/lib/db/products";
import { ProductCard } from "@/components/storefront/product-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden px-4 py-10 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-accent/30 via-primary/10 to-transparent blur-3xl"
      />
      <div className="mb-10 text-center sm:mb-14">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-white/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-primary shadow-sm backdrop-blur">
          No app · No QR code · Just scan
        </span>
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          A physical object that{" "}
          <span className="gradient-text">comes to life</span>
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground sm:max-w-md sm:text-base">
          Point your phone at the printed photo and watch your story play.
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
