export const MAX_VIDEO_HEIGHT = 720; // cap on the long edge, for either orientation

// Even-dimension output (ffmpeg's libx264 requires even width/height); -2
// tells ffmpeg to derive that side from the fixed side while staying even.
export function getDownscaleFilter(width: number, height: number): string | null {
  const longEdge = Math.max(width, height);
  if (longEdge <= MAX_VIDEO_HEIGHT) return null;

  return width >= height
    ? `scale=${MAX_VIDEO_HEIGHT}:-2`
    : `scale=-2:${MAX_VIDEO_HEIGHT}`;
}
