import { NextResponse } from "next/server";
import { getProductById } from "@/lib/db/products";
import { createRazorpayOrder, isPaymentsConfigured } from "@/lib/payments/razorpay";

export async function POST(request: Request) {
  const body = await request.json();
  const { productId } = body as { productId: string };

  const product = await getProductById(productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const amountPaise = product.price_paise;

  if (!isPaymentsConfigured()) {
    return NextResponse.json({ mode: "mock" as const, amountPaise });
  }

  const razorpayOrder = await createRazorpayOrder(amountPaise, productId.slice(0, 30));

  return NextResponse.json({
    mode: "real" as const,
    amountPaise,
    razorpayOrderId: razorpayOrder.id,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
