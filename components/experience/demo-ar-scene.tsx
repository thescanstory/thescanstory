"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ScanLine } from "lucide-react";
import type { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

type Status =
  | "idle"
  | "starting"
  | "scanning"
  | "found"
  | "permission-denied"
  | "camera-not-found"
  | "error";

export function DemoARScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindarRef = useRef<MindARThree | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<string[]>([]);

  const startAR = useCallback(async () => {
    if (!containerRef.current) return;
    setStatus("starting");
    setErrorMessage(null);
    setCameras([]);

    try {
      if (mindarRef.current) {
        console.log("[DemoARScene] Stopping previous instance...");
        try {
          mindarRef.current.stop();
        } catch (e) {
          console.warn("[DemoARScene] Error calling stop():", e);
        }
        const { renderer } = mindarRef.current;
        if (renderer) renderer.setAnimationLoop(null);
        if (containerRef.current) containerRef.current.innerHTML = "";
      }
    } catch (e) {
      console.warn("[DemoARScene] Error cleaning up previous instance:", e);
    }

    try {
      // Step 1: WebGL Check
      let gl: WebGLRenderingContext | null = null;
      try {
        gl =
          document.createElement("canvas").getContext("webgl", {
            failIfMajorPerformanceCaveat: true,
          }) ||
          (document.createElement("canvas").getContext("webgl2") as WebGLRenderingContext | null);
      } catch {
        gl = null;
      }
      if (!gl) {
        throw new Error("WebGL not available. Please enable hardware acceleration in your browser.");
      }
      console.log("[DemoARScene] Step 1/4: WebGL OK");

      // Step 2: Device Enumeration
      let foundCameras: string[] = [];
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        foundCameras = devices
          .filter(d => d.kind === "videoinput")
          .map(d => d.label || `Unknown Camera (${d.deviceId.slice(0, 5)})`);
        setCameras(foundCameras);
        console.log("[DemoARScene] Cameras found:", foundCameras);
      } catch (e) {
        console.warn("[DemoARScene] Could not enumerate devices:", e);
      }

      const { MindARThree } = await import("mind-ar/dist/mindar-image-three.prod.js");
      console.log("[DemoARScene] Step 2/4: MindAR module loaded");

      const mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "/targets.mind",
      });
      mindarRef.current = mindarThree;

      const { renderer, scene, camera } = mindarThree;
      console.log("[DemoARScene] Step 3/4: MindARThree constructed");

      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
      const cube = new THREE.Mesh(geometry, material);
      const anchor = mindarThree.addAnchor(0);
      anchor.group.add(cube);

      anchor.onTargetFound = () => setStatus("found");
      anchor.onTargetLost = () => setStatus("scanning");

      console.log("[DemoARScene] Step 4/4: calling mindarThree.start()…");
      await mindarThree.start();
      renderer.setAnimationLoop(() => renderer.render(scene, camera));
      setStatus("scanning");
    } catch (err) {
      console.error("[DemoARScene] MindAR start failed:", err);
      
      let message = "";
      if (err instanceof Error) {
        message = err.message || err.name;
      } else if (typeof err === "string") {
        message = err;
      } else if (err && typeof err === "object") {
        const obj = err as any;
        message = obj.message || obj.name || obj.code || JSON.stringify(err);
      }

      if (!message) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(t => t.stop());
          message = "Initialization failed (camera is accessible but MindAR could not start).";
        } catch (camErr: any) {
          message = camErr.message || camErr.name || "Camera access failed";
        }
      }

      const lower = message.toLowerCase();
      if (lower.includes("permission") || lower.includes("notallowed")) {
        setStatus("permission-denied");
      } else if (lower.includes("notfound") || lower.includes("device") || lower.includes("readable")) {
        setStatus("camera-not-found");
        setErrorMessage(message);
      } else {
        setStatus("error");
        setErrorMessage(message);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      mindarRef.current?.stop();
    };
  }, []);

  const isOverlayVisible = status !== "scanning" && status !== "found";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* MindAR renders into this container once the camera starts */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* ── Scanning hint ─────────────────────────────────────────────── */}
      {status === "scanning" && (
        <div className="pointer-events-none absolute bottom-10 left-0 right-0 z-10 flex justify-center">
          <p className="rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur">
            Point camera at the target image…
          </p>
        </div>
      )}

      {/* ── Target found — cube is displayed ───────────────────────────── */}
      {status === "found" && (
        <div className="pointer-events-none absolute bottom-10 left-0 right-0 z-10 flex justify-center">
          <p className="rounded-full bg-green-600/70 px-4 py-2 text-sm text-white backdrop-blur">
            Target found! 🎯
          </p>
        </div>
      )}
      {/* ── Full-screen overlay (idle / starting / errors) ─────────────── */}
      {isOverlayVisible && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
          {status === "idle" && (
            <>
              <div className="relative flex h-48 w-48 items-center justify-center">
                <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-white/50 rounded-tl" />
                <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-white/50 rounded-tr" />
                <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-white/50 rounded-bl" />
                <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-white/50 rounded-br" />
                <ScanLine className="h-10 w-10 text-white/40" />
              </div>

              <div className="space-y-2 max-w-xs">
                <p className="text-xl font-semibold text-white">
                  Demo AR Experience
                </p>
                <p className="text-sm text-white/60 leading-relaxed">
                  Point your camera at the target image to see a blue cube
                  appear over it.
                </p>
              </div>

              <button
                onClick={startAR}
                className="rounded-full bg-accent px-10 py-3 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Start AR
              </button>
            </>
          )}

          {status === "starting" && (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <p className="text-sm text-white/70">Opening camera…</p>
            </div>
          )}

          {status === "permission-denied" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Camera access was denied. Please allow camera access in your
                browser settings, then try again.
              </p>
              <button
                onClick={startAR}
                className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Try again
              </button>
            </>
          )}

          {status === "camera-not-found" && (
            <>
              <div className="space-y-4 max-w-xs">
                <p className="text-sm text-white/70">
                  We couldn't find a suitable camera. This often happens on
                  desktops without a webcam or when another app is using the camera.
                </p>
                {cameras.length > 0 && (
                  <div className="rounded bg-white/10 p-3 text-left">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Detected Cameras:
                    </p>
                    <ul className="list-inside list-disc text-xs text-white/60">
                      {cameras.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[10px] text-white/40 italic">
                  Error: {errorMessage}
                </p>
              </div>
              <button
                onClick={startAR}
                className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Try again
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <p className="max-w-xs text-sm text-white/70">
                Something went wrong starting the camera
                {errorMessage ? `: ${errorMessage}` : ""}.
              </p>
              <button
                onClick={startAR}
                className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Try again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

