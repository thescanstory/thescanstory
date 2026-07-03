import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/db/orders";
import { getMediaAssetsByOrder } from "@/lib/db/media-assets";
import { getMessageByOrder } from "@/lib/db/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { ExperienceLinkPanel } from "@/components/admin/experience-link-panel";
import { ResendNotificationButton } from "@/components/admin/resend-notification-button";
import { RecompileMindTargetButton } from "@/components/admin/recompile-mind-target-button";
import { formatDate, formatPaise } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type ShippingAddress = {
  name?: string;
  addressLine?: string;
  city?: string;
  pin?: string;
};

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await getOrderById(params.id);
  if (!order) notFound();

  const [mediaAssets, message] = await Promise.all([
    getMediaAssetsByOrder(order.id),
    getMessageByOrder(order.id),
  ]);

  const supabase = createAdminClient();
  const previews = await Promise.all(
    mediaAssets.map(async (asset) => {
      const { data } = await supabase.storage
        .from(asset.storage_bucket)
        .createSignedUrl(asset.storage_path, 3600);
      return { ...asset, url: data?.signedUrl };
    })
  );

  const address = (order.shipping_address ?? {}) as ShippingAddress;
  const total = order.products
    ? order.products.price_paise + order.cod_handling_fee_paise
    : order.cod_handling_fee_paise;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Order</p>
        <h1 className="font-mono text-lg">{order.id}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-lg shadow-primary/5 backdrop-blur">
          <h2 className="font-medium">Order details</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Product" value={order.products?.name} />
            <Row label="Amount" value={formatPaise(total)} />
            <Row
              label="Payment method"
              value={order.payment_method === "cod" ? "Cash on Delivery" : "Online"}
            />
            <Row label="Payment status" value={order.payment_status} />
            <Row label="COD verified" value={order.cod_verified ? "Yes" : "No"} />
            <Row label="Created" value={formatDate(order.created_at)} />
          </dl>
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Status
            </p>
            <OrderStatusSelect orderId={order.id} status={order.status} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Experience link
            </p>
            <ExperienceLinkPanel orderId={order.id} experienceSlug={order.experience_slug} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Notifications
            </p>
            <ResendNotificationButton orderId={order.id} />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-lg shadow-primary/5 backdrop-blur">
          <h2 className="font-medium">Shipping</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={address.name} />
            <Row label="Address" value={address.addressLine} />
            <Row label="City" value={address.city} />
            <Row label="PIN" value={address.pin} />
            <Row label="Phone" value={order.phone} />
            <Row label="Email" value={order.email} />
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-lg shadow-primary/5 backdrop-blur">
        <h2 className="mb-4 font-medium">Message</h2>
        <p className="whitespace-pre-wrap text-sm">
          {message?.text_content ?? "No message"}
        </p>
      </section>

      <section className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-lg shadow-primary/5 backdrop-blur">
        <h2 className="mb-4 font-medium">Media</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {previews.map((asset) => (
            <div key={asset.id} className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {asset.type.replace("_", " ")}
              </p>
              {asset.url && asset.type === "target_photo" && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt="Target photo" className="max-h-64 rounded border" />
                  <p className="text-xs text-muted-foreground">
                    AR target: {asset.mind_target_path ? "generated" : "missing"}
                  </p>
                  <RecompileMindTargetButton
                    orderId={order.id}
                    mediaAssetId={asset.id}
                    photoUrl={asset.url}
                  />
                </>
              )}
              {asset.url && asset.type === "video" && (
                <video src={asset.url} controls className="max-h-64 rounded border" />
              )}
            </div>
          ))}
          {previews.length === 0 && (
            <p className="text-sm text-muted-foreground">No media uploaded.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value ?? "—"}</dd>
    </div>
  );
}
