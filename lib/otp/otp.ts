/* eslint-disable @typescript-eslint/no-explicit-any */
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

    // 1. Get the most recent active (unverified and unexpired) OTP code
    const { data: activeOtp, error: selectError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("session_id", params.sessionId)
      .eq("phone", params.phone)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      logger.error("Error retrieving OTP for verification", selectError, { sessionId: params.sessionId, phone: params.phone });
      throw selectError;
    }

    if (!activeOtp) {
      logger.warn("No active OTP found for verification", { phone: params.phone, sessionId: params.sessionId });
      return false;
    }

    // 2. Increment attempts count
    const newAttempts = ((activeOtp as any).attempts || 0) + 1;
    const shouldInvalidate = newAttempts >= 3;

    // Update attempts (and invalidate if limit reached)
    const { error: updateAttemptsError } = await supabase
      .from("otp_codes")
      .update({
        attempts: newAttempts,
        ...(shouldInvalidate ? { expires_at: new Date(0).toISOString() } : {}),
      } as any)
      .eq("id", activeOtp.id);

    if (updateAttemptsError) {
      logger.error("Failed to update OTP attempts count", updateAttemptsError, { otpId: activeOtp.id });
      throw updateAttemptsError;
    }

    // 3. Verify code
    if (activeOtp.code !== params.code) {
      logger.warn("Incorrect OTP code entered", {
        phone: params.phone,
        sessionId: params.sessionId,
        attempts: newAttempts,
      });
      return false;
    }

    // 4. Mark as verified
    const { error: verifyError } = await supabase
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", activeOtp.id);

    if (verifyError) {
      logger.error("Failed to mark OTP as verified", verifyError, { otpId: activeOtp.id });
      throw verifyError;
    }

    logger.info("OTP verified successfully", { phone: params.phone, sessionId: params.sessionId });
    return true;
  } catch (error) {
    logger.error("Unexpected error in verifyOtp", error);
    return false;
  }
}

