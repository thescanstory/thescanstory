import { createAdminClient } from "@/lib/supabase/admin";

export async function upsertSessionMessage(sessionId: string, textContent: string) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("messages")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("messages")
      .update({ text_content: textContent })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ session_id: sessionId, text_content: textContent })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getMessageBySession(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMessageByOrder(orderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function reparentSessionMessageToOrder(
  sessionId: string,
  orderId: string
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("messages")
    .update({ order_id: orderId })
    .eq("session_id", sessionId);

  if (error) throw error;
}
