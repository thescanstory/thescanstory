import { createAdminClient } from "@/lib/supabase/admin";

export async function createSession() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .insert({})
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getSession(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
