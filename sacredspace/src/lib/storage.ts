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
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export interface StoredFile {
  /** Public URL for the stored file (absolute for Blob, relative for local) */
  url: string;
  /** Where the file was stored — useful for logging/debugging */
  storage: "blob" | "local";
}

function useBlob(): boolean {
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
  if (useBlob()) {
    const blob = await put(name, buffer, {
      contentType,
      access: "public",
      addRandomSuffix: false,
    });
    return { url: blob.url, storage: "blob" };
  }
  return { url: await putLocal(name, buffer), storage: "local" };
}