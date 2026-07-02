// Swap point: replace the console.log below with a real WhatsApp Business
// API / SMS / email provider call. Callers never change — this is the one
// function the "mark as shipped" server action calls.
export async function sendShippedNotification(params: {
  email: string;
  phone: string;
  experienceUrl: string;
}) {
  console.log(
    `[NOTIFY STUB] Would send experience link to ${params.email} / ${params.phone}: ${params.experienceUrl}`
  );
}
