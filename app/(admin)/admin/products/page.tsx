import Link from "next/link";
import { getProducts } from "@/lib/db/products";
import { ProductsTable } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="gradient-text font-serif text-2xl font-semibold">Products</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">{products.length} total</p>
          <Button size="sm" asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        </div>
      </div>

      <ProductsTable products={products} />
    </div>
  );
}
