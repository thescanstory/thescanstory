import { notFound } from "next/navigation";
import { getOrderBySlug } from "@/lib/db/orders";
import { getMediaAssetsByOrder } from "@/lib/db/media-assets";
import { getMessageByOrder } from "@/lib/db/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { splitMessage } from "@/lib/experience/split-message";
import { PhotowallGame } from "@/components/experience/photowall-game";

export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function ExperienceGamePage({
  params,
}: {
  params: { slug: string };
}) {
  const order = await getOrderBySlug(params.slug);
  if (!order) notFound();

  const [assets, messageRow] = await Promise.all([
    getMediaAssetsByOrder(order.id),
    getMessageByOrder(order.id),
  ]);

  const photo = assets.find((a) => a.type === "target_photo");
  if (!photo) notFound();

  const supabase = createAdminClient();
  const photoSigned = await supabase.storage
    .from(photo.storage_bucket)
    .createSignedUrl(photo.storage_path, SIGNED_URL_TTL_SECONDS);

  const { heading } = splitMessage(messageRow?.text_content ?? "");

  return (
    <PhotowallGame
      slug={params.slug}
      photoUrl={photoSigned.data?.signedUrl ?? ""}
      heading={heading || "Us"}
    />
  );
}
