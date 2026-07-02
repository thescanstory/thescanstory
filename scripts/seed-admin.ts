// Uses the GoTrue Admin REST API directly instead of @supabase/supabase-js
// — the JS client eagerly initializes a Realtime client that requires
// native WebSocket support (Node 22+), which this one-off script has no
// need to drag in.

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceRoleKey || !email || !password) {
  console.error(
    "Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD"
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${serviceRoleKey}`,
  apikey: serviceRoleKey,
  "Content-Type": "application/json",
};

async function main() {
  const listRes = await fetch(`${url}/auth/v1/admin/users`, { headers });
  const listBody = (await listRes.json()) as { users?: { email?: string }[] };

  if (listBody.users?.some((u) => u.email === email)) {
    console.log(`Admin user ${email} already exists, skipping.`);
    return;
  }

  const createRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    console.error("Failed to create admin user:", body);
    process.exit(1);
  }

  console.log(`Created admin user: ${email}`);
}

main();
