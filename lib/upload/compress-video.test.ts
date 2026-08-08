import { writeFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { downloadMock, uploadMock, fromMock } = vi.hoisted(() => ({
  downloadMock: vi.fn(),
  uploadMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: { from: fromMock },
  }),
}));

const { probeVideoDimensionsMock, transcodeVideoMock } = vi.hoisted(() => ({
  probeVideoDimensionsMock: vi.fn(),
  transcodeVideoMock: vi.fn(),
}));

vi.mock("./ffmpeg-exec", () => ({
  probeVideoDimensions: probeVideoDimensionsMock,
  transcodeVideo: transcodeVideoMock,
}));

import { compressVideoInStorage } from "./compress-video";

const ORIGINAL_BYTES = Buffer.from("o".repeat(1000));

function fakeDownloadBlob(bytes: Buffer) {
  return { arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
}

beforeEach(() => {
  fromMock.mockReturnValue({ download: downloadMock, upload: uploadMock });
  downloadMock.mockResolvedValue({ data: fakeDownloadBlob(ORIGINAL_BYTES), error: null });
  uploadMock.mockResolvedValue({ error: null });
  probeVideoDimensionsMock.mockResolvedValue({ width: 1080, height: 1920 });
  // Default: transcode "succeeds" by writing a smaller file than the input.
  transcodeVideoMock.mockImplementation(async ({ outputPath }: { outputPath: string }) => {
    await writeFile(outputPath, Buffer.from("c".repeat(100)));
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("compressVideoInStorage", () => {
  it("skips compression and reports not-compressed when the download fails", async () => {
    downloadMock.mockResolvedValue({ data: null, error: new Error("not found") });

    const result = await compressVideoInStorage({ bucket: "uploads-active", path: "o1/video.mp4" });

    expect(result).toEqual({ compressed: false });
    expect(transcodeVideoMock).not.toHaveBeenCalled();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("still transcodes without a scale filter when the probe can't read dimensions", async () => {
    probeVideoDimensionsMock.mockResolvedValue(null);

    await compressVideoInStorage({ bucket: "uploads-active", path: "o1/video.mp4" });

    expect(transcodeVideoMock).toHaveBeenCalledWith(
      expect.objectContaining({ scaleFilter: null })
    );
  });

  it("passes a downscale filter through when the source exceeds the height cap", async () => {
    probeVideoDimensionsMock.mockResolvedValue({ width: 1080, height: 1920 });

    await compressVideoInStorage({ bucket: "uploads-active", path: "o1/video.mp4" });

    expect(transcodeVideoMock).toHaveBeenCalledWith(
      expect.objectContaining({ scaleFilter: "scale=-2:720" })
    );
  });

  it("reports not-compressed and skips the upload when transcoding throws", async () => {
    transcodeVideoMock.mockRejectedValue(new Error("ffmpeg crashed"));

    const result = await compressVideoInStorage({ bucket: "uploads-active", path: "o1/video.mp4" });

    expect(result).toEqual({ compressed: false });
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("keeps the original and skips the upload when the transcoded file isn't smaller", async () => {
    transcodeVideoMock.mockImplementation(async ({ outputPath }: { outputPath: string }) => {
      await writeFile(outputPath, Buffer.from("c".repeat(ORIGINAL_BYTES.byteLength * 2)));
    });

    const result = await compressVideoInStorage({ bucket: "uploads-active", path: "o1/video.mp4" });

    expect(result).toEqual({ compressed: false });
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("uploads the compressed file back to the same path and reports compressed:true on success", async () => {
    const result = await compressVideoInStorage({ bucket: "uploads-active", path: "o1/video.mp4" });

    expect(result).toEqual({ compressed: true });
    expect(fromMock).toHaveBeenCalledWith("uploads-active");
    expect(uploadMock).toHaveBeenCalledWith(
      "o1/video.mp4",
      expect.any(Buffer),
      expect.objectContaining({ contentType: "video/mp4", upsert: true })
    );
    const uploadedBuffer = uploadMock.mock.calls[0][1] as Buffer;
    expect(uploadedBuffer.byteLength).toBe(100);
  });

  it("reports not-compressed when the re-upload fails", async () => {
    uploadMock.mockResolvedValue({ error: new Error("storage full") });

    const result = await compressVideoInStorage({ bucket: "uploads-active", path: "o1/video.mp4" });

    expect(result).toEqual({ compressed: false });
  });

  it("never throws, even if the storage client itself throws", async () => {
    downloadMock.mockRejectedValue(new Error("network blip"));

    await expect(
      compressVideoInStorage({ bucket: "uploads-active", path: "o1/video.mp4" })
    ).resolves.toEqual({ compressed: false });
  });
});
