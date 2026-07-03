"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { CheckCircle2, ImageIcon, Loader2, VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCustomizeSession } from "@/lib/hooks/use-customize-session";
import { uploadFileDirect } from "@/lib/upload/upload-file";
import { validateTargetPhoto, validateVideo } from "@/lib/upload/validate";
import { compileMindTarget } from "@/lib/mindar/compile-target";
import { messageSchema } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

type UploadStatus =
  | "idle"
  | "validating"
  | "compiling"
  | "uploading"
  | "done"
  | "error";

interface UploadState {
  status: UploadStatus;
  fileName?: string;
  previewUrl?: string;
  error?: string;
  progress?: number;
}

export function CustomizeForm({ productId }: { productId: string }) {
  const router = useRouter();
  const { sessionId, loading: sessionLoading } = useCustomizeSession(productId);

  const [photo, setPhoto] = useState<UploadState>({ status: "idle" });
  const [video, setVideo] = useState<UploadState>({ status: "idle" });
  const [message, setMessage] = useState("");
  const [messageSaved, setMessageSaved] = useState(false);
  const messageDebounce = useRef<ReturnType<typeof setTimeout>>();

  const onPhotoDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file || !sessionId) return;

      setPhoto({ status: "validating", previewUrl: URL.createObjectURL(file) });
      const validationError = await validateTargetPhoto(file);
      if (validationError) {
        setPhoto({ status: "error", error: validationError });
        return;
      }

      try {
        setPhoto((s) => ({ ...s, status: "compiling", progress: 0 }));
        const mindBlob = await compileMindTarget(file, (progress) => {
          setPhoto((s) => ({ ...s, progress }));
        });

        setPhoto((s) => ({ ...s, status: "uploading" }));
        const ext = file.name.split(".").pop() ?? "jpg";
        const { path: photoPath } = await uploadFileDirect({
          bucket: "uploads-temp",
          sessionId,
          fileName: `target-photo.${ext}`,
          file,
        });
        const { path: mindPath } = await uploadFileDirect({
          bucket: "uploads-temp",
          sessionId,
          fileName: "target.mind",
          file: mindBlob,
        });

        await fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            type: "target_photo",
            storageBucket: "uploads-temp",
            storagePath: photoPath,
            mindTargetPath: mindPath,
          }),
        });

        setPhoto((s) => ({ ...s, status: "done", fileName: file.name }));
      } catch (err) {
        setPhoto((s) => ({
          ...s,
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        }));
      }
    },
    [sessionId]
  );

  const onVideoDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file || !sessionId) return;

      setVideo({ status: "validating", previewUrl: URL.createObjectURL(file) });
      const validationError = await validateVideo(file);
      if (validationError) {
        setVideo({ status: "error", error: validationError });
        return;
      }

      try {
        setVideo((s) => ({ ...s, status: "uploading" }));
        const ext = file.name.split(".").pop() ?? "mp4";
        const { path } = await uploadFileDirect({
          bucket: "uploads-temp",
          sessionId,
          fileName: `video.${ext}`,
          file,
        });

        await fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            type: "video",
            storageBucket: "uploads-temp",
            storagePath: path,
          }),
        });

        setVideo((s) => ({ ...s, status: "done", fileName: file.name }));
      } catch (err) {
        setVideo((s) => ({
          ...s,
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        }));
      }
    },
    [sessionId]
  );

  const photoDropzone = useDropzone({
    onDrop: onPhotoDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: !sessionId,
  });

  const videoDropzone = useDropzone({
    onDrop: onVideoDrop,
    accept: { "video/*": [] },
    maxFiles: 1,
    disabled: !sessionId,
  });

  useEffect(() => {
    if (!sessionId || !message) return;
    setMessageSaved(false);
    if (messageDebounce.current) clearTimeout(messageDebounce.current);

    messageDebounce.current = setTimeout(async () => {
      const parsed = messageSchema.safeParse({ textContent: message });
      if (!parsed.success) return;
      await fetch(`/api/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      setMessageSaved(true);
    }, 800);

    return () => {
      if (messageDebounce.current) clearTimeout(messageDebounce.current);
    };
  }, [message, sessionId]);

  const canContinue =
    photo.status === "done" && video.status === "done" && message.trim().length > 0;
  const canSkip =
    !!sessionId &&
    photo.status !== "compiling" &&
    photo.status !== "uploading" &&
    video.status !== "uploading";

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <Label className="text-base">1. Upload the photo to print</Label>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">
          This becomes the printed image. Use a clear, well-lit photo, at
          least 1000x1000px.
        </p>
        <DropzoneBox
          rootProps={photoDropzone.getRootProps()}
          inputProps={photoDropzone.getInputProps()}
          state={photo}
          icon={<ImageIcon className="h-6 w-6" />}
          isDragActive={photoDropzone.isDragActive}
          previewIsImage
        />
      </section>

      <section>
        <Label className="text-base">2. Upload your video message</Label>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">
          Max 60 seconds, 100MB. This plays when the printed photo is
          scanned.
        </p>
        <DropzoneBox
          rootProps={videoDropzone.getRootProps()}
          inputProps={videoDropzone.getInputProps()}
          state={video}
          icon={<VideoIcon className="h-6 w-6" />}
          isDragActive={videoDropzone.isDragActive}
        />
      </section>

      <section>
        <Label htmlFor="message" className="text-base">
          3. Write your message
        </Label>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">
          Shown on the greeting screen before the AR experience launches.
        </p>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          rows={5}
          placeholder="Write your love letter, birthday message, or story..."
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{messageSaved ? "Saved" : ""}</span>
          <span>{message.length}/1000</span>
        </div>
      </section>

      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full"
          disabled={!canContinue}
          onClick={() => router.push(`/checkout?productId=${productId}`)}
        >
          Continue to Checkout
        </Button>
        <div className="text-center">
          <button
            type="button"
            disabled={!canSkip}
            onClick={() => router.push(`/checkout?productId=${productId}`)}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary disabled:pointer-events-none disabled:opacity-50"
          >
            Skip for now — I&apos;ll send my photo &amp; video separately
          </button>
        </div>
      </div>
    </div>
  );
}

function DropzoneBox({
  rootProps,
  inputProps,
  state,
  icon,
  isDragActive,
  previewIsImage,
}: {
  rootProps: ReturnType<typeof import("react-dropzone").useDropzone>["getRootProps"] extends (
    ...args: never[]
  ) => infer R
    ? R
    : never;
  inputProps: ReturnType<typeof import("react-dropzone").useDropzone>["getInputProps"] extends (
    ...args: never[]
  ) => infer R
    ? R
    : never;
  state: UploadState;
  icon: React.ReactNode;
  isDragActive: boolean;
  previewIsImage?: boolean;
}) {
  return (
    <div
      {...rootProps}
      className={cn(
        "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-white/50 p-6 text-center backdrop-blur transition-all",
        isDragActive
          ? "border-primary bg-gradient-to-br from-secondary to-white shadow-glow"
          : "border-input hover:border-primary/40 hover:bg-white/70",
        state.status === "error" && "border-destructive"
      )}
    >
      <input {...inputProps} />
      {state.status === "idle" && (
        <>
          {icon}
          <p className="text-sm text-muted-foreground">
            Drag & drop, or click to select a file
          </p>
        </>
      )}
      {state.status === "validating" && (
        <>
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm text-muted-foreground">Checking file…</p>
        </>
      )}
      {state.status === "compiling" && (
        <>
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Preparing your photo for AR… {state.progress ?? 0}%
          </p>
        </>
      )}
      {state.status === "uploading" && (
        <>
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm text-muted-foreground">Uploading…</p>
        </>
      )}
      {state.status === "done" && (
        <>
          {previewIsImage && state.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.previewUrl}
              alt="Preview"
              className="h-24 w-24 rounded object-cover"
            />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-primary" />
          )}
          <p className="text-sm font-medium">{state.fileName}</p>
          <p className="text-xs text-muted-foreground">
            Click to replace
          </p>
        </>
      )}
      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </div>
  );
}
