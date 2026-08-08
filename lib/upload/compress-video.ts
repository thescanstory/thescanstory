import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { probeVideoDimensions, transcodeVideo } from "./ffmpeg-exec";
import { getDownscaleFilter } from "./video-downscale";

// Runs after a video lands in Supabase Storage (called from
// /api/upload/complete). Best-effort by design, mirroring the other
// storage housekeeping in lib/db/media-assets.ts: any failure — download,
// ffmpeg, or the re-upload — just leaves the original (already
// size/duration-validated) file in place rather than blocking the order.
export async function compressVideoInStorage(params: {
  bucket: string;
  path: string;
}): Promise<{ compressed: boolean }> {
  const supabase = createAdminClient();
  let workDir: string | null = null;

  try {
    const { data: original, error: downloadError } = await supabase.storage
      .from(params.bucket)
      .download(params.path);
    if (downloadError || !original) return { compressed: false };

    const originalBytes = Buffer.from(await original.arrayBuffer());

    workDir = await mkdtemp(join(tmpdir(), "scan-story-compress-"));
    const inputPath = join(workDir, "input");
    const outputPath = join(workDir, "output.mp4");
    await writeFile(inputPath, originalBytes);

    const dimensions = await probeVideoDimensions(inputPath);
    const scaleFilter = dimensions
      ? getDownscaleFilter(dimensions.width, dimensions.height)
      : null;

    await transcodeVideo({ inputPath, outputPath, scaleFilter });

    const compressedStat = await stat(outputPath);
    if (compressedStat.size >= originalBytes.byteLength) {
      return { compressed: false };
    }

    const compressedBytes = await readFile(outputPath);
    const { error: uploadError } = await supabase.storage
      .from(params.bucket)
      .upload(params.path, compressedBytes, {
        contentType: "video/mp4",
        upsert: true,
      });
    if (uploadError) return { compressed: false };

    return { compressed: true };
  } catch {
    return { compressed: false };
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}
