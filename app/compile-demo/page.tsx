"use client";

import { useState } from "react";

export default function CompileDemoPage() {
  const [status, setStatus] = useState("Click the button to start compilation");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);

  const startCompile = async () => {
    setRunning(true);
    setStatus("Loading MindAR compiler…");

    try {
      const { Compiler } = await import("mind-ar/dist/mindar-image.prod.js");

      setStatus("Loading target image…");
      const img = new Image();
      img.src = "/demo-target.jpg";
      await img.decode();

      setStatus("Compiling… 0%");
      const compiler = new Compiler();
      await compiler.compileImageTargets([img], (p: number) => {
        const pct = Math.round(p * 100);
        setStatus(`Compiling… ${pct}%`);
        setProgress(pct);
      });

      const exported: ArrayBuffer = await compiler.exportData();
      const blob = new Blob([exported], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      setStatus("✅ Done! Download below.");
      setDone(true);

      // Auto-trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = "targets.mind";
      a.click();
    } catch (e: unknown) {
      setStatus("❌ Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold">Demo .mind Compiler</h1>
      <p className="text-sm text-gray-400 max-w-md text-center">
        This compiles <code className="bg-gray-800 px-1 rounded">/public/demo-target.jpg</code> into{" "}
        <code className="bg-gray-800 px-1 rounded">targets.mind</code> for the AR demo.
      </p>

      {!running && !done && (
        <button
          onClick={startCompile}
          className="rounded-full bg-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-purple-500"
        >
          ⚡ Compile &amp; Download targets.mind
        </button>
      )}

      {running && (
        <div className="flex flex-col items-center gap-3 w-72">
          <div className="h-3 w-full rounded-full bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-300">{status}</p>
        </div>
      )}

      {done && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg text-green-400 font-semibold">{status}</p>
          <p className="text-sm text-gray-400">
            Move the downloaded <code className="bg-gray-800 px-1 rounded">targets.mind</code> into{" "}
            <code className="bg-gray-800 px-1 rounded">/public/</code> and visit{" "}
            <a href="/demo" className="text-purple-400 underline">
              /demo
            </a>
            .
          </p>
          <button
            onClick={startCompile}
            className="mt-2 rounded-full border border-gray-600 px-6 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            Recompile
          </button>
        </div>
      )}
    </main>
  );
}
