import { Resend } from "resend";
import { isSmsConfigured, sendShippedSms } from "@/lib/sms/sms";
import { logger } from "@/lib/logger";

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

function renderOrderPlacedEmail(params: { customerName?: string; orderId: string; trackUrl: string }) {
  const greeting = params.customerName ? `Hi ${params.customerName},` : "Hi,";
  return {
    subject: `Your Scan Story order ${params.orderId.slice(0, 8)} is confirmed!`,
    html: `
      <p>${greeting}</p>
      <p>We've received your order and are preparing your magical AR experience. You can track your order status here:</p>
      <p><a href="${params.trackUrl}">${params.trackUrl}</a></p>
      <p>— The Scan Story</p>
    `,
  };
}

function renderReminderEmail(params: { customerName?: string; experienceUrl: string }) {
  const greeting = params.customerName ? `Hi ${params.customerName},` : "Hi,";
  return {
    subject: "Haven't opened your AR experience yet?",
    html: `
      <p>${greeting}</p>
      <p>Your Scan Story experience is waiting for you! Click the link below to dive in:</p>
      <p><a href="${params.experienceUrl}">${params.experienceUrl}</a></p>
      <p>— The Scan Story</p>
    `,
  };
}

async function sendSms(params: { phone: string; experienceUrl: string }) {
  if (!isSmsConfigured()) {
    console.log(`[SMS STUB] Would send experience link to ${params.phone}: ${params.experienceUrl}`);
    logger.info("SMS notification (stub mode)", { phone: params.phone, experienceUrl: params.experienceUrl });
    return;
  }

  try {
    await sendShippedSms(params.phone, params.experienceUrl);
    logger.info("SMS notification sent", { phone: params.phone });
  } catch (err) {
    logger.error(`[SMS FAILED] ${params.phone}:`, err);
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
    logger.info("Email notification (stub mode)", { email: params.email, experienceUrl: params.experienceUrl });
    return;
  }

  try {
    const { subject, html } = renderShippedEmail(params);
    const client = getClient();
    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: params.email,
      subject,
      html,
    });

    if (error) {
      logger.error(`[EMAIL FAILED] ${params.email}:`, error);
    } else {
      logger.info("Email notification sent", { email: params.email });
    }
  } catch (error) {
    logger.error("Error sending email notification", error, { email: params.email });
  }
}

export async function sendOrderPlacedNotification(params: {
  email: string;
  phone: string;
  orderId: string;
  trackUrl: string;
  customerName?: string;
}) {
  const { sendOrderConfirmedSms } = await import("@/lib/sms/sms");
  if (!isSmsConfigured()) {
    logger.info("SMS notification (stub mode)", { phone: params.phone, trackUrl: params.trackUrl });
  } else {
    try {
      await sendOrderConfirmedSms(params.phone, params.orderId, params.trackUrl);
    } catch {
      // Ignored
    }
  }

  if (!isEmailConfigured()) {
    logger.info("Email notification (stub mode)", { email: params.email, trackUrl: params.trackUrl });
    return;
  }
  try {
    const { subject, html } = renderOrderPlacedEmail(params);
    const client = getClient();
    await client.emails.send({ from: FROM_ADDRESS, to: params.email, subject, html });
  } catch {
    // Ignored
  }
}

export async function sendReminderNotification(params: {
  email: string;
  phone: string;
  experienceUrl: string;
  customerName?: string;
}) {
  const { sendReminderSms } = await import("@/lib/sms/sms");
  if (!isSmsConfigured()) {
    logger.info("SMS notification (stub mode)", { phone: params.phone, experienceUrl: params.experienceUrl });
  } else {
    try {
      await sendReminderSms(params.phone, params.experienceUrl);
    } catch {
      // Ignored
    }
  }

  if (!isEmailConfigured()) {
    logger.info("Email notification (stub mode)", { email: params.email, experienceUrl: params.experienceUrl });
    return;
  }
  try {
    const { subject, html } = renderReminderEmail(params);
    const client = getClient();
    await client.emails.send({ from: FROM_ADDRESS, to: params.email, subject, html });
  } catch {
    // Ignored
  }
}
