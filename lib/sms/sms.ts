const MSG91_BASE_URL = "https://control.msg91.com/api/v5";

// True once real MSG91 credentials are set. Until then, callers fall back
// to a console stub. Mirrors isEmailConfigured() in lib/notify/notify.ts
// and isPaymentsConfigured() in lib/payments/razorpay.ts — no code changes
// needed to "graduate" to real sending later, just set the env vars.
//
// MSG91 (not a generic/global provider) because Indian carriers require
// DLT-registered sender IDs and templates for transactional SMS — an
// unregistered sender gets silently blocked, not just undelivered. The
// OTP/SHIPPED template IDs below must match templates already approved
// under your DLT registration; the {{OTP}}/{{LINK}} variable names must
// match exactly what each approved template declares.
export function isSmsConfigured() {
  return Boolean(
    process.env.MSG91_AUTH_KEY &&
      process.env.MSG91_SENDER_ID &&
      process.env.MSG91_OTP_TEMPLATE_ID &&
      process.env.MSG91_SHIPPED_TEMPLATE_ID
  );
}

async function sendTemplateSms(params: {
  phone: string; // 10-digit Indian mobile, matches shippingSchema's phone regex
  templateId: string;
  variables: Record<string, string>;
}) {
  const res = await fetch(`${MSG91_BASE_URL}/flow/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: process.env.MSG91_AUTH_KEY!,
    },
    body: JSON.stringify({
      template_id: params.templateId,
      sender: process.env.MSG91_SENDER_ID,
      short_url: "0",
      mobiles: `91${params.phone}`,
      ...params.variables,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MSG91 send failed (${res.status}): ${body}`);
  }
}

export async function sendOtpSms(phone: string, code: string) {
  await sendTemplateSms({
    phone,
    templateId: process.env.MSG91_OTP_TEMPLATE_ID!,
    variables: { OTP: code },
  });
}

export async function sendShippedSms(phone: string, experienceUrl: string) {
  await sendTemplateSms({
    phone,
    templateId: process.env.MSG91_SHIPPED_TEMPLATE_ID!,
    variables: { LINK: experienceUrl },
  });
}
