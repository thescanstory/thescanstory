"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compileMindTarget } from "@/lib/mindar/compile-target";
import { uploadFileDirect } from "@/lib/upload/upload-file";

export function RecompileMindTargetButton({
  orderId,
  mediaAssetId,
  photoUrl,
}: {
  orderId: string;
  mediaAssetId: string;
  photoUrl: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "compiling" | "uploading">("idle");
  const [progress, setProgress] = useState(0);

  async function recompile() {
    setStatus("compiling");
    setProgress(0);
    try {
      const photoRes = await fetch(photoUrl);
      if (!photoRes.ok) throw new Error("Could not download current photo");
      const photoBlob = await photoRes.blob();
      const photoFile = new File([photoBlob], "target-photo", {
        type: photoBlob.type || "image/jpeg",
      });

      const mindBlob = await compileMindTarget(photoFile, setProgress);

      setStatus("uploading");
      const { path } = await uploadFileDirect({
        bucket: "uploads-active",
        sessionId: orderId,
        fileName: "target.mind",
        file: mindBlob,
      });

      const res = await fetch(`/api/admin/orders/${orderId}/recompile-mind-target`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaAssetId, mindTargetPath: path }),
      });
      if (!res.ok) throw new Error("Failed to save new AR target");

      toast.success("AR target recompiled");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Recompile failed");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <Button size="sm" variant="outline" disabled={status !== "idle"} onClick={recompile}>
      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
      {status === "compiling" && `Compiling… ${progress}%`}
      {status === "uploading" && "Uploading…"}
      {status === "idle" && "Recompile AR target"}
    </Button>
  );
}
