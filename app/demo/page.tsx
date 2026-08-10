import { DemoARScene } from "@/components/experience/demo-ar-scene";

export default function DemoPage() {
  return (
    // Pinned to the exact visible viewport (not 100vh) so the MindAR
    // projection aligns the 3D overlay precisely with the camera video.
    <main className="fixed inset-0 z-0 h-full w-full overflow-hidden bg-black">
      <DemoARScene />
    </main>
  );
}
