import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/db/products";
import { formatPaise } from "@/lib/utils/format";
import type { Database } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { DemoFlow } from "@/components/experience/demo-flow";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<
  Database["public"]["Tables"]["products"]["Row"]["type"],
  string
> = {
  frame: "Photo Frame",
  wallet_card: "Wallet Card",
  tshirt: "T-Shirt",
};

export default async function StorefrontHomePage() {
  const products = await getProducts();

  return (
    <main className="flex flex-col min-h-screen w-full bg-background">
      {/* 1. Interactive Demo Hero */}
      <DemoFlow showShopButton />

      {/* 2. Store Products Section */}
      <section id="shop" className="w-full bg-muted/30 border-t py-24 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border px-6 py-2 rounded-full shadow-sm">
          <p className="text-sm font-semibold tracking-widest text-primary uppercase">
            Create Yours
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-primary">
              Turn your memories into <br className="hidden sm:block" />
              interactive experiences.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a product, upload your favorite photo and a hidden video message. 
              When someone scans the physical print with our app, your memory comes to life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white border shadow-sm hover:shadow-xl hover:border-accent/40 transition-all duration-300"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 bg-secondary/30">
                      <span className="font-medium">No Image Available</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                    {TYPE_LABELS[product.type]}
                  </div>
                </div>
                
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-primary">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-lg font-bold gradient-text">
                      {formatPaise(product.price_paise)}
                    </p>
                    <Button variant="ghost" className="rounded-full px-4 text-primary font-semibold group-hover:bg-accent group-hover:text-white transition-colors">
                      Personalize
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
