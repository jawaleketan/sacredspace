import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDel = vi.fn().mockResolvedValue(undefined);

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
  del: mockDel,
}));

const { deleteStoredFile } = await import("../storage");

const BLOB_URL = "https://abc123.public.blob.vercel-storage.com/deity-x.png";

describe("deleteStoredFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDel.mockResolvedValue(undefined);
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL;
  });

  it("does nothing for null/undefined/empty URLs", async () => {
    await deleteStoredFile(null);
    await deleteStoredFile(undefined);
    await deleteStoredFile("");
    expect(mockDel).not.toHaveBeenCalled();
  });

  it("ignores seed and other local /uploads/ files (Blob-only cleanup)", async () => {
    await deleteStoredFile("/uploads/ganesha.png");
    await deleteStoredFile("/uploads/deity-abc123.png");
    expect(mockDel).not.toHaveBeenCalled();
  });

  it("ignores external http(s) URLs", async () => {
    await deleteStoredFile("https://example.com/some-file.png");
    // Blob-shaped host but without the public prefix storeFile produces
    await deleteStoredFile("https://abc123.blob.vercel-storage.com/deity-x.png");
    expect(mockDel).not.toHaveBeenCalled();
  });

  it("deletes a blob URL when the Blob store is configured", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token";
    process.env.VERCEL = "1";

    await deleteStoredFile(BLOB_URL);

    expect(mockDel).toHaveBeenCalledOnce();
    expect(mockDel).toHaveBeenCalledWith(BLOB_URL);
  });

  it("skips blob deletion when no Blob token is configured", async () => {
    process.env.VERCEL = "1"; // token missing

    await deleteStoredFile(BLOB_URL);

    expect(mockDel).not.toHaveBeenCalled();
  });

  it("swallows blob deletion failures", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "token";
    process.env.VERCEL = "1";
    mockDel.mockRejectedValue(new Error("blob down"));

    await expect(deleteStoredFile(BLOB_URL)).resolves.toBeUndefined();
  });
});
