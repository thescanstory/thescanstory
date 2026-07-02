import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateExperienceSlug } from "@/lib/utils/slug";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("orders")
      .update({ experience_slug: generateExperienceSlug() })
      .eq("id", params.id)
      .select("experience_slug")
      .single();

    if (!error) return NextResponse.json({ experienceSlug: data.experience_slug });
    if (error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Failed to regenerate link" }, { status: 500 });
}
