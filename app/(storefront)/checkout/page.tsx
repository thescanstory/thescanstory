import { notFound } from "next/navigation";
import { getProductById } from "@/lib/db/products";
import { CheckoutFlow } from "@/components/storefront/checkout-flow";

const COD_HANDLING_FEE_PAISE = Number(process.env.COD_HANDLING_FEE_PAISE ?? 4900);

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { productId?: string };
}) {
  if (!searchParams.productId) notFound();
  const product = await getProductById(searchParams.productId);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="mb-6 font-serif text-xl font-semibold sm:mb-8 sm:text-2xl">
        Checkout
      </h1>
      <CheckoutFlow
        productId={product.id}
        productName={product.name}
        pricePaise={product.price_paise}
        codHandlingFeePaise={COD_HANDLING_FEE_PAISE}
      />
    </div>
  );
}
