import { createAdminClient } from "@/lib/supabase/admin";

export async function findOrCreateCustomer(params: {
  name: string;
  email: string;
  phone: string;
}) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("customers")
    .select("*")
    .eq("email", params.email)
    .eq("phone", params.phone)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("customers")
    .insert(params)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
