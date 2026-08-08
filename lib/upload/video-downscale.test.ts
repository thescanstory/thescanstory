import { describe, expect, it } from "vitest";
import { MAX_VIDEO_HEIGHT, getDownscaleFilter } from "./video-downscale";

describe("getDownscaleFilter", () => {
  it("returns null for a portrait video already at or under the height cap", () => {
    expect(getDownscaleFilter(720, MAX_VIDEO_HEIGHT)).toBeNull();
  });

  it("returns null for a landscape video already under the cap", () => {
    expect(getDownscaleFilter(640, 360)).toBeNull();
  });

  it("returns an ffmpeg scale filter capping height for a taller-than-cap portrait video", () => {
    expect(getDownscaleFilter(1080, 1920)).toBe(`scale=-2:${MAX_VIDEO_HEIGHT}`);
  });

  it("caps by the larger dimension, not always height, for a landscape video", () => {
    // 3840x2160 landscape: the long edge (width) should drive the cap so the
    // filter still meaningfully shrinks the file, not just the short edge.
    expect(getDownscaleFilter(3840, 2160)).toBe(`scale=${MAX_VIDEO_HEIGHT}:-2`);
  });

  it("never upscales — a tiny video is left untouched", () => {
    expect(getDownscaleFilter(320, 240)).toBeNull();
  });
});
