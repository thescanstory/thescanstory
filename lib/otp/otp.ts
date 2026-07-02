import { createAdminClient } from "@/lib/supabase/admin";

const OTP_TTL_MINUTES = 5;
const DEV_OTP_CODE = "123456";

function generateCode() {
  return process.env.NODE_ENV === "production"
    ? String(Math.floor(100000 + Math.random() * 900000))
    : DEV_OTP_CODE;
}

export async function sendOtp(params: { sessionId: string; phone: string }) {
  const supabase = createAdminClient();
  const code = generateCode();
  const expiresAt = new Date(
    Date.now() + OTP_TTL_MINUTES * 60 * 1000
  ).toISOString();

  const { error } = await supabase.from("otp_codes").insert({
    session_id: params.sessionId,
    phone: params.phone,
    code,
    expires_at: expiresAt,
  });
  if (error) throw error;

  // Swap point: replace this console.log with a real SMS provider call
  // (MSG91/Twilio). Callers of sendOtp/verifyOtp never change.
  console.log(`[OTP STUB] Would send code "${code}" to ${params.phone} via SMS.`);
}

export async function verifyOtp(params: {
  sessionId: string;
  phone: string;
  code: string;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("otp_codes")
    .select("*")
    .eq("session_id", params.sessionId)
    .eq("phone", params.phone)
    .eq("code", params.code)
    .eq("verified", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;

  const { error: updateError } = await supabase
    .from("otp_codes")
    .update({ verified: true })
    .eq("id", data.id);
  if (updateError) throw updateError;

  return true;
}
