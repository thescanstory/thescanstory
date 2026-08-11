import { createAdminClient } from "@/lib/supabase/admin";
import { isSmsConfigured, sendOtpSms } from "@/lib/sms/sms";
import { logger } from "@/lib/logger";

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
    code, // Note: In production, consider hashing this before storage
    expires_at: expiresAt,
  });
  if (error) {
    logger.error("Failed to store OTP", error, { sessionId: params.sessionId, phone: params.phone });
    throw error;
  }

  if (!isSmsConfigured()) {
    console.log(`[OTP STUB] Would send code "${code}" to ${params.phone} via SMS.`);
    logger.info("OTP generated (stub mode)", { phone: params.phone, sessionId: params.sessionId });
    return;
  }

  try {
    await sendOtpSms(params.phone, code);
    logger.info("OTP sent via SMS", { phone: params.phone, sessionId: params.sessionId });
  } catch (err) {
    // Fail-open: the code is already stored and the customer can request
    // a resend. Mirrors the email-send failure handling in lib/notify/notify.ts.
    logger.error(`[SMS FAILED] OTP to ${params.phone}:`, err, { sessionId: params.sessionId });
  }
}

export async function verifyOtp(params: {
  sessionId: string;
  phone: string;
  code: string;
}) {
  try {
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

    if (error) {
      logger.error("Error verifying OTP", error, { sessionId: params.sessionId, phone: params.phone });
      throw error;
    }
    if (!data) {
      logger.warn("Invalid or expired OTP", { phone: params.phone, sessionId: params.sessionId });
      return false;
    }

    const { error: updateError } = await supabase
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", data.id);
    if (updateError) {
      logger.error("Failed to mark OTP as verified", updateError, { otpId: data.id });
      throw updateError;
    }

    logger.info("OTP verified successfully", { phone: params.phone, sessionId: params.sessionId });
    return true;
  } catch (error) {
    logger.error("Unexpected error in verifyOtp", error);
    return false;
  }
}
