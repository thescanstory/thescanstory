import { notFound } from "next/navigation";
import { getOrderBySlug } from "@/lib/db/orders";
import { getMediaAssetsByOrder } from "@/lib/db/media-assets";
import { getMessageByOrder } from "@/lib/db/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { GreetingScreen } from "@/components/experience/greeting-screen";
import { PreparingScreen } from "@/components/experience/preparing-screen";

export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function ExperienceGreetingPage({
  params,
}: {
  params: { slug: string };
}) {
  const order = await getOrderBySlug(params.slug);
  if (!order) notFound();

  const [assets, message] = await Promise.all([
    getMediaAssetsByOrder(order.id),
    getMessageByOrder(order.id),
  ]);

  const photo = assets.find((a) => a.type === "target_photo");
  const video = assets.find((a) => a.type === "video");
  // Orders can now be placed without uploading (customer sends media
  // separately, admin attaches it later) — that's a valid, expected state,
  // not a broken link, so this shows a holding screen rather than 404ing.
  if (!photo || !video) return <PreparingScreen />;

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

  const cachedConfirmed = photo.cached_confirmed && video.cached_confirmed;

  return (
    <GreetingScreen
      slug={params.slug}
      orderId={order.id}
      message={message?.text_content ?? "You have a story waiting for you."}
      cachedConfirmed={cachedConfirmed}
      signedUrls={{
        photo: photoSigned.data?.signedUrl ?? "",
        video: videoSigned.data?.signedUrl ?? "",
        mind: mindSigned.data?.signedUrl ?? "",
      }}
    />
  );
}
