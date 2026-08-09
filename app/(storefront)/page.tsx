"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "starting" | "running" | "permission-denied" | "error";

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const start = useCallback(async () => {
    setStatus("starting");
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("running");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (/permission|NotAllowedError/i.test(message)) {
        setStatus("permission-denied");
      } else {
        setStatus("error");
        setErrorMessage(message);
      }
    }
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Live camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Scanning overlay — always visible on top of the feed */}
      {status === "running" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="relative h-64 w-64">
            <span className="absolute left-0 top-0 h-10 w-10 border-l-4 border-t-4 border-white rounded-tl-sm" />
            <span className="absolute right-0 top-0 h-10 w-10 border-r-4 border-t-4 border-white rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 h-10 w-10 border-b-4 border-l-4 border-white rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 h-10 w-10 border-b-4 border-r-4 border-white rounded-br-sm" />
            {/* Animated scan line */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-white/80 animate-scan" />
          </div>
          <p className="mt-6 text-sm font-medium uppercase tracking-widest text-white/70">
            Point at your frame
          </p>
        </div>
      )}

      {/* Pre-camera overlay */}
      {status !== "running" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
          {(status === "idle" || status === "starting") && (
            <>
              <div className="relative flex h-56 w-56 items-center justify-center">
                <span className="absolute left-0 top-0 h-10 w-10 border-l-4 border-t-4 border-white/60 rounded-tl-sm" />
                <span className="absolute right-0 top-0 h-10 w-10 border-r-4 border-t-4 border-white/60 rounded-tr-sm" />
                <span className="absolute bottom-0 left-0 h-10 w-10 border-b-4 border-l-4 border-white/60 rounded-bl-sm" />
                <span className="absolute bottom-0 right-0 h-10 w-10 border-b-4 border-r-4 border-white/60 rounded-br-sm" />
                <p className="text-xs font-medium uppercase tracking-widest text-white/40">
                  {status === "starting" ? "Opening…" : "Aim at your frame"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold">Scan your printed frame</p>
                <p className="max-w-xs text-sm text-white/60">
                  Point your camera at the photo frame — your video will play right over it.
                </p>
              </div>
              {status === "idle" && (
                <Button
                  size="lg"
                  className="rounded-full bg-white px-10 text-black font-semibold hover:bg-white/90"
                  onClick={start}
                >
                  Open Camera
                </Button>
              )}
            </>
          )}

          {status === "permission-denied" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Camera access was denied. Please allow camera access in your browser settings, then try again.
              </p>
              <Button
                size="lg"
                className="rounded-full bg-white px-10 text-black font-semibold hover:bg-white/90"
                onClick={start}
              >
                Try again
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Something went wrong{errorMessage ? `: ${errorMessage}` : ""}.
              </p>
              <Button
                size="lg"
                className="rounded-full bg-white px-10 text-black font-semibold hover:bg-white/90"
                onClick={start}
              >
                Try again
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
