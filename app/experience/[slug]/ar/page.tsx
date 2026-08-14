import { notFound } from "next/navigation";
import { getOrderBySlug } from "@/lib/db/orders";
import { getMediaAssetsByOrder } from "@/lib/db/media-assets";
import { getMessageByOrder } from "@/lib/db/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { splitMessage } from "@/lib/experience/split-message";
import { ARScene } from "@/components/experience/ar-scene";
import { PreparingScreen } from "@/components/experience/preparing-screen";

export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function ExperiencePage({
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
  const video = assets.find((a) => a.type === "video");

  // Media not attached yet — show a "come back soon" screen
  if (!photo || !video) {
    return <PreparingScreen />;
  }

  const supabase = createAdminClient();
  const [photoSigned, videoSigned, mindSigned] = await Promise.all([
    supabase.storage
      .from(photo.storage_bucket)
      .createSignedUrl(photo.storage_path, SIGNED_URL_TTL_SECONDS),
    supabase.storage
      .from(video.storage_bucket)
      .createSignedUrl(video.storage_path, SIGNED_URL_TTL_SECONDS),
    photo.mind_target_path
      ? supabase.storage
          .from(photo.storage_bucket)
          .createSignedUrl(photo.mind_target_path, SIGNED_URL_TTL_SECONDS)
      : Promise.resolve({ data: null }),
  ]);

  // Extract the heading from the message to use as a personal welcome line
  const { heading } = splitMessage(messageRow?.text_content ?? "");
  const welcomeMessage = heading
    ? `${heading} ✨`
    : "Your AR experience is ready ✨";

  return (
    <ARScene
      orderId={order.id}
      slug={params.slug}
      welcomeMessage={welcomeMessage}
      signedUrls={{
        photo: photoSigned.data?.signedUrl ?? "",
        video: videoSigned.data?.signedUrl ?? "",
        mind: mindSigned.data?.signedUrl ?? "",
      }}
    />
  );
}
