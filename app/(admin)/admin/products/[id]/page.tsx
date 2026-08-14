import { ProductForm } from "@/components/admin/product-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProductById } from "@/lib/db/products";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/products" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Products
        </Link>
        <h1 className="gradient-text font-serif text-2xl font-semibold">Edit Product</h1>
      </div>

      <ProductForm product={product} />
    </div>
  );
}
