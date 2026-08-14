"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductType = Database["public"]["Enums"]["product_type"];

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  // Store the raw user input for rupees (e.g. "999")
  const [priceRupees, setPriceRupees] = useState(
    product ? (product.price_paise / 100).toString() : ""
  );
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [type, setType] = useState<ProductType>(product?.type ?? "frame");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const pricePaise = Math.round(parseFloat(priceRupees) * 100);
      
      const payload = {
        name,
        description,
        price_paise: pricePaise,
        image_url: imageUrl,
        type,
      };

      const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
      const method = product ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to save product");
      }

      toast.success(product ? "Product updated successfully!" : "Product created successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white/70 p-6 rounded-xl border border-white/60 shadow-sm backdrop-blur">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-white/60 bg-white/50 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="e.g. Classic Frame"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-white/60 bg-white/50 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Optional description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Price (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={priceRupees}
            onChange={(e) => setPriceRupees(e.target.value)}
            required
            className="w-full rounded-md border border-white/60 bg-white/50 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. 999.00"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ProductType)}
            className="w-full rounded-md border border-white/60 bg-white/50 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="frame">Frame</option>
            <option value="wallet_card">Wallet Card</option>
            <option value="tshirt">T-Shirt</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Image URL</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full rounded-md border border-white/60 bg-white/50 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-muted-foreground">URL of the product image.</p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/40">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Product"}
        </Button>
      </div>
    </form>
  );
}
