import { NextResponse } from "next/server";
import { getMediaAssetsBySession } from "@/lib/db/media-assets";
import { getMessageBySession } from "@/lib/db/messages";
import { getSession } from "@/lib/db/sessions";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    
    // Verify session exists
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const [assets, message] = await Promise.all([
      getMediaAssetsBySession(sessionId),
      getMessageBySession(sessionId),
    ]);

    const photoAsset = assets.find((a) => a.type === "target_photo");
    const videoAsset = assets.find((a) => a.type === "video");

    return NextResponse.json({
      photo: photoAsset ? { fileName: photoAsset.storage_path.split("/").pop() } : null,
      video: videoAsset ? { fileName: videoAsset.storage_path.split("/").pop() } : null,
      message: message?.text_content || "",
    });
  } catch (err) {
    console.error("Failed to fetch session state:", err);
    return NextResponse.json(
      { error: "Failed to fetch session state" },
      { status: 500 }
    );
  }
}
