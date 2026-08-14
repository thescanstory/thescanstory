import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth/require-admin";
import { productSchema } from "@/lib/validation/schemas";
import { updateProduct } from "@/lib/db/products";
import { logger } from "@/lib/logger";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthenticated = await isAdminAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid product data" },
        { status: 400 }
      );
    }

    const product = await updateProduct(params.id, parsed.data);
    logger.info("Admin updated product", { productId: product.id });
    
    return NextResponse.json(product);
  } catch (error: unknown) {
    logger.error("Error updating product", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
