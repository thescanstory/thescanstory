import { NextResponse } from "next/server";
import { updateMediaAssetMindTargetPath } from "@/lib/db/media-assets";
import { isAdminAuthenticated } from "@/lib/auth/require-admin";

// The actual MindAR compile happens client-side (see lib/mindar/compile-target.ts —
// the compiler needs Canvas/WebGL and isn't Node-runnable) in the admin's own
// browser; this just records the result. Recovery path for a target_photo
// whose .mind file never got generated (compile failed/timed out/browser
// closed mid-checkout) or needs regenerating after a bad crop.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mediaAssetId, mindTargetPath } = body as {
    mediaAssetId: string;
    mindTargetPath: string;
  };

  if (!mediaAssetId || !mindTargetPath) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const asset = await updateMediaAssetMindTargetPath(
    mediaAssetId,
    params.id,
    mindTargetPath
  );

  if (!asset) {
    return NextResponse.json(
      { error: "Media asset not found for this order" },
      { status: 404 }
    );
  }

  return NextResponse.json({ asset });
}
