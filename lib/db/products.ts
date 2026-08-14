import { createAdminClient } from "@/lib/supabase/admin";

export async function getProducts() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getProductById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createProduct(params: {
  name: string;
  description?: string | null;
  price_paise: number;
  image_url?: string | null;
  type: "frame" | "wallet_card" | "tshirt";
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: params.name,
      description: params.description ?? null,
      price_paise: params.price_paise,
      image_url: params.image_url ?? null,
      type: params.type,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, params: {
  name: string;
  description?: string | null;
  price_paise: number;
  image_url?: string | null;
  type: "frame" | "wallet_card" | "tshirt";
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      name: params.name,
      description: params.description ?? null,
      price_paise: params.price_paise,
      image_url: params.image_url ?? null,
      type: params.type,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
