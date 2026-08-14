"use client";

import Link from "next/link";
import { formatPaise } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Edit, Image as ImageIcon } from "lucide-react";
import type { Database } from "@/types/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function ProductsTable({ products }: { products: Product[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/60 bg-white/70 shadow-sm backdrop-blur">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/60 bg-white/40">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6">Image</th>
              <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6">Type</th>
              <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6">Price</th>
              <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/40">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-white/40">
                  <td className="px-4 py-3 sm:px-6">
                    {product.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded-md object-cover border border-white/60" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center border border-white/60">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium sm:px-6">{product.name}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {product.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-6">{formatPaise(product.price_paise)}</td>
                  <td className="px-4 py-3 text-right sm:px-6">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/products/${product.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
