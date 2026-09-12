/**
 * File storage abstraction.
 *
 * Production (Vercel): uploads go to Vercel Blob when BLOB_READ_WRITE_TOKEN
 * is set — the Lambda filesystem is ephemeral, so writing to public/uploads/
 * there would silently lose files on the next cold start.
 *
 * Local dev / fallback: writes to public/uploads/ on disk so development
 * works with zero configuration.
 *
 * Returned URLs:
 *   - Blob: a permanent CDN URL (e.g. https://<store>.public.blob.vercel-storage.com/...)
 *   - Local: a relative /uploads/<name> path served by the dev server
 */
import { put, del } from "@vercel/blob";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export interface StoredFile {
  /** Public URL for the stored file (absolute for Blob, relative for local) */
  url: string;
  /** Where the file was stored — useful for logging/debugging */
  storage: "blob" | "local";
}

function shouldUseBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN && !!process.env.VERCEL;
}

async function putLocal(name: string, buffer: Buffer): Promise<string> {
  const uploadDir = path.resolve("public/uploads");
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, name), buffer);
  return `/uploads/${name}`;
}

/**
 * Store an uploaded file. Uses Vercel Blob in production (when configured),
 * local public/uploads/ otherwise.
 *
 * @param name - Unique generated filename (see generateUploadName)
 * @param buffer - File contents
 * @param contentType - MIME type detected during upload validation
 */
export async function storeFile(
  name: string,
  buffer: Buffer,
  contentType: string,
): Promise<StoredFile> {
  if (shouldUseBlob()) {
    const blob = await put(name, buffer, {
      contentType,
      access: "public",
      addRandomSuffix: false,
    });
    return { url: blob.url, storage: "blob" };
  }
  return { url: await putLocal(name, buffer), storage: "local" };
}

/**
 * Best-effort delete of a previously stored file, used when an upload is
 * replaced or removed so old Blob objects don't accumulate as orphans.
 *
 * Blob URLs are deleted only when a Blob token is configured (the same gate
 * as put() in storeFile, so a URL from a different Blob store is never
 * touched). Local /uploads/ paths — including the git-committed seed images —
 * are intentionally never deleted: in production the filesystem is read-only,
 * and in dev we can't distinguish an admin upload from a seed asset.
 *
 * Anything else (external/CDN URLs, empty or malformed values) is ignored.
 * Failures are logged, never thrown — a failed cleanup must not fail the
 * request that replaced the file.
 */
export async function deleteStoredFile(url: string | null | undefined): Promise<void> {
  if (!url) return;

  // Matches the Blob URL shape produced by storeFile's put() above.
  if (shouldUseBlob() && url.startsWith("https://") && url.includes(".public.blob.vercel-storage.com/")) {
    try {
      await del(url);
    } catch (e) {
      console.error("deleteStoredFile: blob delete failed (ignored)", url, e);
    }
  }
  // Local /uploads/ paths and anything else: deliberately left alone.
}