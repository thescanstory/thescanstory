"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { CheckCircle2, ImageIcon, Loader2, VideoIcon } from "lucide-react";
import { uploadFileDirect } from "@/lib/upload/upload-file";
import { validateTargetPhoto, validateVideo } from "@/lib/upload/validate";
import { compileMindTarget } from "@/lib/mindar/compile-target";
import { cn } from "@/lib/utils";

type Status = "idle" | "validating" | "compiling" | "uploading" | "done" | "error";
interface UploadState {
  status: Status;
  fileName?: string;
  error?: string;
  progress?: number;
}

// Counterpart to the customer-facing CustomizeForm, for orders placed
// without uploading (customer sends the photo/video some other way). Same
// validate -> compile -> upload pipeline, targeting the order directly via
// /api/admin/orders/[id]/attach-media instead of a pre-checkout session.
export function AttachMediaPanel({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<UploadState>({ status: "idle" });
  const [video, setVideo] = useState<UploadState>({ status: "idle" });

  const onPhotoDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setPhoto({ status: "validating" });
      const validationError = await validateTargetPhoto(file);
      if (validationError) {
        setPhoto({ status: "error", error: validationError });
        return;
      }

      try {
        setPhoto({ status: "compiling", progress: 0 });
        const mindBlob = await compileMindTarget(file, (progress) => {
          setPhoto((s) => ({ ...s, progress }));
        });

        setPhoto((s) => ({ ...s, status: "uploading" }));
        const ext = file.name.split(".").pop() ?? "jpg";
        const { path: photoPath } = await uploadFileDirect({
          bucket: "uploads-active",
          sessionId: orderId,
          fileName: `target-photo.${ext}`,
          file,
        });
        const { path: mindPath } = await uploadFileDirect({
          bucket: "uploads-active",
          sessionId: orderId,
          fileName: "target.mind",
          file: mindBlob,
        });

        const res = await fetch(`/api/admin/orders/${orderId}/attach-media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "target_photo",
            storageBucket: "uploads-active",
            storagePath: photoPath,
            mindTargetPath: mindPath,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Upload failed");
        }

        setPhoto({ status: "done", fileName: file.name });
        toast.success("Photo attached");
        router.refresh();
      } catch (err) {
        setPhoto({
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    },
    [orderId, router]
  );

  const onVideoDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setVideo({ status: "validating" });
      const validationError = await validateVideo(file);
      if (validationError) {
        setVideo({ status: "error", error: validationError });
        return;
      }

      try {
        setVideo({ status: "uploading" });
        const ext = file.name.split(".").pop() ?? "mp4";
        const { path } = await uploadFileDirect({
          bucket: "uploads-active",
          sessionId: orderId,
          fileName: `video.${ext}`,
          file,
        });

        const res = await fetch(`/api/admin/orders/${orderId}/attach-media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "video",
            storageBucket: "uploads-active",
            storagePath: path,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Upload failed");
        }

        setVideo({ status: "done", fileName: file.name });
        toast.success("Video attached");
        router.refresh();
      } catch (err) {
        setVideo({
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    },
    [orderId, router]
  );

  const photoDropzone = useDropzone({ onDrop: onPhotoDrop, accept: { "image/*": [] }, maxFiles: 1 });
  const videoDropzone = useDropzone({ onDrop: onVideoDrop, accept: { "video/*": [] }, maxFiles: 1 });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Zone
        dropzone={photoDropzone}
        state={photo}
        label="Target photo"
        icon={<ImageIcon className="h-5 w-5" />}
      />
      <Zone
        dropzone={videoDropzone}
        state={video}
        label="Video"
        icon={<VideoIcon className="h-5 w-5" />}
      />
    </div>
  );
}

function Zone({
  dropzone,
  state,
  label,
  icon,
}: {
  dropzone: ReturnType<typeof useDropzone>;
  state: UploadState;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      {...dropzone.getRootProps()}
      className={cn(
        "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed bg-white/50 p-4 text-center backdrop-blur transition-all",
        dropzone.isDragActive
          ? "border-primary bg-gradient-to-br from-secondary to-white shadow-glow"
          : "border-input hover:border-primary/40 hover:bg-white/70",
        state.status === "error" && "border-destructive"
      )}
    >
      <input {...dropzone.getInputProps()} />
      {state.status === "idle" && (
        <>
          {icon}
          <p className="text-xs text-muted-foreground">Drop {label.toLowerCase()} here</p>
        </>
      )}
      {state.status === "validating" && (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs text-muted-foreground">Checking…</p>
        </>
      )}
      {state.status === "compiling" && (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs text-muted-foreground">Compiling AR target… {state.progress ?? 0}%</p>
        </>
      )}
      {state.status === "uploading" && (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs text-muted-foreground">Uploading…</p>
        </>
      )}
      {state.status === "done" && (
        <>
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <p className="text-xs font-medium">{state.fileName}</p>
        </>
      )}
      {state.status === "error" && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
    </div>
  );
}
