import { notFound } from "next/navigation";
import { getProductById } from "@/lib/db/products";
import { CustomizeForm } from "@/components/storefront/customize-form";

export const dynamic = "force-dynamic";

export default async function CustomizePage({
  params,
}: {
  params: { productId: string };
}) {
  const product = await getProductById(params.productId);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="font-serif text-xl font-semibold sm:text-2xl">
        Personalize your {product.name}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        Upload your photo and video — nothing is lost if you leave and come
        back.
      </p>
      <div className="mt-6 sm:mt-8">
        <CustomizeForm productId={product.id} />
      </div>
    </div>
  );
}
