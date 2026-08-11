import test from "node:test";
import assert from "node:assert";
import { createAdminClient } from "../lib/supabase/admin";
import { getProductById } from "../lib/db/products";

const baseUrl = "http://localhost:3000";

test("End-to-End API and Database Flow", async (t) => {
  const supabase = createAdminClient();
  let testSessionId: string;
  let testProductId: string;
  let testOrderId: string;

  await t.test("1. Database Connection and Product Fetch", async () => {
    // Get a product from the DB to test with
    const { data: products, error } = await supabase.from("products").select("id").limit(1);
    assert.ifError(error);
    assert.ok(products && products.length > 0, "No products found in DB");
    testProductId = products[0].id;
  });

  await t.test("2. App Health Check", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200, "Health check failed");
    const json = await res.json();
    assert.strictEqual(json.status, "healthy");
  });

  let csrfToken: string;
  let cookie: string;

  await t.test("2.5 Get CSRF Token", async () => {
    const res = await fetch(`${baseUrl}/api/csrf`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.csrfToken);
    csrfToken = json.csrfToken;
    cookie = res.headers.get("set-cookie")?.split(";")[0] || "";
  });

  await t.test("3. Create Session API", async () => {
    const res = await fetch(`${baseUrl}/api/session`, { method: "POST" });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.sessionId, "Session ID should be returned");
    testSessionId = json.sessionId;
  });

  await t.test("4. Add Message to Session", async () => {
    const res = await fetch(`${baseUrl}/api/session/${testSessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken, "cookie": cookie },
      body: JSON.stringify({ textContent: "This is a test message" }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.message);
  });

  await t.test("5. Checkout Create Order (Simulated Online)", async () => {
    const res = await fetch(`${baseUrl}/api/checkout/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken, "cookie": cookie },
      body: JSON.stringify({ productId: testProductId }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.amountPaise > 0);
  });

  await t.test("6. Checkout Confirm (Simulate Payment Success)", async () => {
    const shipping = {
      name: "Test User",
      addressLine: "123 Test Street",
      city: "Test City",
      pin: "123456",
      phone: "9876543210",
      email: "test@thescanstory.com"
    };

    const res = await fetch(`${baseUrl}/api/checkout/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken, "cookie": cookie },
      body: JSON.stringify({
        sessionId: testSessionId,
        productId: testProductId,
        paymentMethod: "online",
        shipping,
      }),
    });
    
    assert.strictEqual(res.status, 200, `Checkout confirm failed: ${await res.text()}`);
    const json = await res.json();
    assert.ok(json.orderId);
    assert.ok(json.experienceSlug);
    testOrderId = json.orderId;
  });

  await t.test("7. Verify Order was Saved in DB", async () => {
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", testOrderId)
      .single();
      
    assert.ifError(error);
    assert.strictEqual(order.status, "paid");
    assert.strictEqual(order.payment_method, "online");
    assert.strictEqual(order.email, "test@thescanstory.com");
  });

  await t.test("8. Export CSV Endpoint", async () => {
    // Requires admin auth normally, so it should return 401
    const res = await fetch(`${baseUrl}/api/admin/orders/export-report`);
    assert.strictEqual(res.status, 401);
  });
});
