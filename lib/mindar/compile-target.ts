// Client-only. Compiles a target photo into a MindAR .mind target file in
// the browser at upload time — MindAR's Compiler is not Node-runnable
// (it touches Canvas/window internally), so this stands in for the "async
// background job" the spec describes: same UX (a progress step during
// upload), just synchronous-in-browser rather than a server queue.

const MAX_COMPILE_DIMENSION = 1024;

async function downscaleToCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_COMPILE_DIMENSION / Math.max(bitmap.width, bitmap.height)
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas 2D context");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function compileMindTarget(
  file: File,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const { Compiler } = await import("mind-ar/dist/mindar-image.prod.js");
  const canvas = await downscaleToCanvas(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL("image/jpeg", 0.92);
  });

  const compiler = new Compiler();

  // MindAR's compiler runs on TensorFlow.js's WebGL backend. If WebGL is
  // unavailable (old browser, disabled GPU), some failure modes throw
  // outside the promise chain instead of rejecting it, which would hang
  // this forever with no feedback — race a timeout so the UI always
  // surfaces an error instead of spinning indefinitely.
  const COMPILE_TIMEOUT_MS = 45000;
  await Promise.race([
    compiler.compileImageTargets([image], (progress: number) => {
      onProgress?.(progress);
    }),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Photo processing timed out — try a different browser or photo")),
        COMPILE_TIMEOUT_MS
      )
    ),
  ]);

  const exported: ArrayBuffer = await compiler.exportData();
  return new Blob([exported], { type: "application/octet-stream" });
}
