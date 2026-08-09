import { Resend } from "resend";
import { isSmsConfigured, sendShippedSms } from "@/lib/sms/sms";

const PLACEHOLDER_MARKERS = ["", "re_xxxxxxxxxxxx"];
const FROM_ADDRESS = "The Scan Story <onboarding@resend.dev>";

// True once a real Resend key is dropped into RESEND_API_KEY. Until then,
// shipment emails run in a clearly-labeled simulated mode — no code changes
// needed to "graduate" to real sending later, just set the env var. Mirrors
// isPaymentsConfigured() in lib/payments/razorpay.ts.
export function isEmailConfigured() {
  const key = process.env.RESEND_API_KEY ?? "";
  return key.startsWith("re_") && !PLACEHOLDER_MARKERS.includes(key);
}

function getClient() {
  return new Resend(process.env.RESEND_API_KEY!);
}

function renderShippedEmail(params: { customerName?: string; experienceUrl: string }) {
  const greeting = params.customerName ? `Hi ${params.customerName},` : "Hi,";
  return {
    subject: "Your Scan Story is on its way",
    html: `
      <p>${greeting}</p>
      <p>Your Scan Story has shipped. Once it arrives, scan the printed photo to bring it to life — or open the link below right now:</p>
      <p><a href="${params.experienceUrl}">${params.experienceUrl}</a></p>
      <p>— The Scan Story</p>
    `,
  };
}

async function sendSms(params: { phone: string; experienceUrl: string }) {
  if (!isSmsConfigured()) {
    console.log(`[SMS STUB] Would send experience link to ${params.phone}: ${params.experienceUrl}`);
    return;
  }

  try {
    await sendShippedSms(params.phone, params.experienceUrl);
  } catch (err) {
    console.error(`[SMS FAILED] ${params.phone}:`, err);
  }
}

export async function sendShippedNotification(params: {
  email: string;
  phone: string;
  experienceUrl: string;
  customerName?: string;
}) {
  await sendSms(params);

  if (!isEmailConfigured()) {
    console.log(
      `[EMAIL STUB] Would send experience link to ${params.email}: ${params.experienceUrl}`
    );
    return;
  }

  const { subject, html } = renderShippedEmail(params);
  const client = getClient();
  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: params.email,
    subject,
    html,
  });

  if (error) {
    console.error(`[EMAIL FAILED] ${params.email}:`, error);
  }
}
