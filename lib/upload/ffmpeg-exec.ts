import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpegStaticPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const execFileAsync = promisify(execFile);

// Both binaries are bundled via ffmpeg-static/ffprobe-static rather than
// assumed to be on $PATH — Vercel's Node.js function runtime has neither
// preinstalled. See next.config.mjs (serverComponentsExternalPackages) and
// the deployment checklist for the file-tracing config that ships these
// binaries with the /api/upload/complete function.
const FFMPEG_PATH = ffmpegStaticPath as unknown as string;
const FFPROBE_PATH = ffprobeStatic.path;

const EXEC_TIMEOUT_MS = 90_000;

export async function probeVideoDimensions(
  filePath: string
): Promise<{ width: number; height: number } | null> {
  try {
    const { stdout } = await execFileAsync(
      FFPROBE_PATH,
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "csv=s=x:p=0",
        filePath,
      ],
      { timeout: EXEC_TIMEOUT_MS }
    );
    const [width, height] = stdout.trim().split("x").map(Number);
    if (!width || !height) return null;
    return { width, height };
  } catch {
    return null;
  }
}

export async function transcodeVideo(params: {
  inputPath: string;
  outputPath: string;
  scaleFilter: string | null;
}): Promise<void> {
  const args = [
    "-y",
    "-i",
    params.inputPath,
    ...(params.scaleFilter ? ["-vf", params.scaleFilter] : []),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "26",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    params.outputPath,
  ];
  await execFileAsync(FFMPEG_PATH, args, { timeout: EXEC_TIMEOUT_MS });
}
