import { notFound } from "next/navigation";
import { getOrderBySlug } from "@/lib/db/orders";
import { CatchTheHeartGame } from "@/components/experience/catch-the-heart-game";

export const dynamic = "force-dynamic";

export default async function ExperienceGamePage({
  params,
}: {
  params: { slug: string };
}) {
  const order = await getOrderBySlug(params.slug);
  if (!order) notFound();

  return <CatchTheHeartGame slug={params.slug} />;
}
