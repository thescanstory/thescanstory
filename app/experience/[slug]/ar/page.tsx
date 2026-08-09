import { redirect } from "next/navigation";

// The AR experience now lives at /experience/[slug] directly.
// This route is kept so any old links don't 404.
export default function ExperienceArRedirectPage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/experience/${params.slug}`);
}
