import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export async function findOrCreateCustomer(params: {
  name: string;
  email: string;
  phone: string;
  address?: Json;
}) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("customers")
    .select("*")
    .eq("email", params.email)
    .eq("phone", params.phone)
    .maybeSingle();

  if (existing) {
    if (params.address) {
      const { data, error } = await supabase
        .from("customers")
        .update({ address: params.address })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (!error && data) return data;
    }
    return existing;
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: params.name,
      email: params.email,
      phone: params.phone,
      ...(params.address ? { address: params.address } : {}),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
