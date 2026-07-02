import { notFound } from "next/navigation";
import { getOrderBySlug } from "@/lib/db/orders";
import { getMediaAssetsByOrder } from "@/lib/db/media-assets";
import { createAdminClient } from "@/lib/supabase/admin";
import { ARScene } from "@/components/experience/ar-scene";

export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function ExperienceArPage({
  params,
}: {
  params: { slug: string };
}) {
  const order = await getOrderBySlug(params.slug);
  if (!order) notFound();

  const assets = await getMediaAssetsByOrder(order.id);
  const photo = assets.find((a) => a.type === "target_photo");
  const video = assets.find((a) => a.type === "video");
  if (!photo || !video) notFound();

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

  return (
    <ARScene
      orderId={order.id}
      slug={params.slug}
      signedUrls={{
        photo: photoSigned.data?.signedUrl ?? "",
        video: videoSigned.data?.signedUrl ?? "",
        mind: mindSigned.data?.signedUrl ?? "",
      }}
    />
  );
}
