import { createAdminClient } from "@/lib/supabase/admin";
import { generateExperienceSlug } from "@/lib/utils/slug";
import type {
  Json,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/database.types";

const ORDERS_PAGE_SIZE = 20;

export async function createOrder(params: {
  sessionId: string | null;
  customerId: string | null;
  productId: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  codVerified: boolean;
  codHandlingFeePaise: number;
  shippingAddress: Json;
  phone: string;
  email: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
}) {
  const supabase = createAdminClient();
  const status: OrderStatus =
    params.paymentMethod === "cod"
      ? "cod_pending"
      : params.paymentStatus === "paid"
        ? "paid"
        : "pending";

  // Retry a handful of times on the rare experience_slug collision rather
  // than pre-checking uniqueness (insert-and-retry avoids a race between
  // check and insert).
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        session_id: params.sessionId,
        customer_id: params.customerId,
        product_id: params.productId,
        status,
        payment_method: params.paymentMethod,
        payment_status: params.paymentStatus,
        cod_verified: params.codVerified,
        cod_handling_fee_paise: params.codHandlingFeePaise,
        shipping_address: params.shippingAddress,
        phone: params.phone,
        email: params.email,
        experience_slug: generateExperienceSlug(),
        razorpay_order_id: params.razorpayOrderId ?? null,
        razorpay_payment_id: params.razorpayPaymentId ?? null,
      })
      .select("*")
      .single();

    if (!error) return data;
    if (error.code !== "23505") throw error; // not a unique-violation, bail
  }

  throw new Error("Failed to generate a unique experience slug after 5 attempts");
}

export async function getOrderBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, products(*)")
    .eq("experience_slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getOrderByRazorpayOrderId(razorpayOrderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getOrderById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, products(*), customers(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getOrdersByIds(ids: string[]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, phone, shipping_address, experience_slug, products(name)")
    .in("id", ids);

  if (error) throw error;
  return data;
}

export async function listOrders(params: {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  page?: number;
}) {
  const supabase = createAdminClient();
  const page = params.page ?? 1;
  const from = (page - 1) * ORDERS_PAGE_SIZE;
  const to = from + ORDERS_PAGE_SIZE - 1;

  let query = supabase
    .from("orders")
    .select("*, products(name, type)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq("status", params.status);
  if (params.paymentMethod)
    query = query.eq("payment_method", params.paymentMethod);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    orders: data,
    total: count ?? 0,
    page,
    pageSize: ORDERS_PAGE_SIZE,
  };
}

export async function getDashboardMetrics() {
  const supabase = createAdminClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: todayOrders } = await supabase
    .from("orders")
    .select("products(price_paise), cod_handling_fee_paise")
    .gte("created_at", startOfDay.toISOString());

  let totalOrdersToday = 0;
  let revenueTodayPaise = 0;
  
  if (todayOrders) {
    totalOrdersToday = todayOrders.length;
    revenueTodayPaise = todayOrders.reduce((sum, order) => {
      // Supabase relation might return an array or single object
      // depending on the exact typing, but standard one-to-one or
      // many-to-one returns a single object. We handle both just in case.
      const p = Array.isArray(order.products) ? order.products[0] : order.products;
      // Note: Only sum revenue for orders that are actually paid or COD? 
      // The prompt says "revenue today", let's sum up everything placed today
      return sum + (p?.price_paise ?? 0) + (order.cod_handling_fee_paise ?? 0);
    }, 0);
  }

  const { count: pendingCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("status", ["paid", "cod_pending"]);

  return {
    totalOrdersToday,
    revenueTodayPaise,
    pendingFulfillmentCount: pendingCount ?? 0,
  };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// Bulk "mark as shipped" — returns the updated rows so the caller can fan
// out shipped-link notifications.
export async function markOrdersShipped(ids: string[]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "shipped" })
    .in("id", ids)
    .select("*");

  if (error) throw error;
  return data;
}

export async function markOrderPaid(params: {
  orderId: string;
  razorpayPaymentId: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "paid",
      razorpay_payment_id: params.razorpayPaymentId,
    })
    .eq("id", params.orderId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function findOrdersNeedingReminder() {
  const supabase = createAdminClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from("orders")
    .select("*, media_assets!inner(cached_confirmed)")
    .eq("status", "shipped")
    .lte("updated_at", twentyFourHoursAgo);

  if (error) throw error;

  return data.filter(order => order.media_assets.some(m => !m.cached_confirmed));
}

export async function findUnprintableOrders() {
  const supabase = createAdminClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from("orders")
    .select("*, customers(name)")
    .lte("created_at", twentyFourHoursAgo)
    .in("status", ["pending"]); // Unpaid online orders or unverified CODs

  if (error) throw error;
  return data;
}
