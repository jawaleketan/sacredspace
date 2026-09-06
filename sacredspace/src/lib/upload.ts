import { randomUUID } from "node:crypto";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE = 20 * 1024 * 1024;

const MAGIC_BYTES: Record<string, { magic: number[]; ext: string; mime: string }[]> = {
  image: [
    { magic: [0x89, 0x50, 0x4E, 0x47], ext: "png", mime: "image/png" },
    { magic: [0xFF, 0xD8, 0xFF], ext: "jpg", mime: "image/jpeg" },
    { magic: [0x47, 0x49, 0x46], ext: "gif", mime: "image/gif" },
    { magic: [0x52, 0x49, 0x46, 0x46], ext: "webp", mime: "image/webp" },
  ],
  audio: [
    { magic: [0x49, 0x44, 0x33], ext: "mp3", mime: "audio/mpeg" },
    { magic: [0xFF, 0xFB], ext: "mp3", mime: "audio/mpeg" },
    { magic: [0x4F, 0x67, 0x67, 0x53], ext: "ogg", mime: "audio/ogg" },
    { magic: [0x66, 0x4C, 0x61, 0x43], ext: "flac", mime: "audio/flac" },
    { magic: [0x52, 0x49, 0x46, 0x46], ext: "wav", mime: "audio/wav" },
    { magic: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], ext: "m4a", mime: "audio/mp4" },
  ],
};

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

function detectFormat(buffer: Buffer, category: "image" | "audio"): { ext: string; mime: string } | null {
  for (const fmt of MAGIC_BYTES[category]) {
    const match = fmt.magic.every((byte, i) => buffer[i] === byte);
    if (match) return { ext: fmt.ext, mime: fmt.mime };
  }
  return null;
}

export function validateImageUpload(base64: string): { buffer: Buffer; ext: string; mime: string } {
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) throw new UploadError("Empty file");
  if (buffer.length > MAX_IMAGE_SIZE) throw new UploadError("Image exceeds 5MB limit");

  const format = detectFormat(buffer, "image");
  if (!format) throw new UploadError("Invalid image format. Accepted: PNG, JPEG, GIF, WebP");

  return { buffer, ext: format.ext, mime: format.mime };
}

export function validateAudioUpload(base64: string): { buffer: Buffer; ext: string; mime: string } {
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) throw new UploadError("Empty file");
  if (buffer.length > MAX_AUDIO_SIZE) throw new UploadError("Audio exceeds 20MB limit");

  const format = detectFormat(buffer, "audio");
  if (!format) throw new UploadError("Invalid audio format. Accepted: MP3, OGG, FLAC, WAV, M4A");

  return { buffer, ext: format.ext, mime: format.mime };
}

export function generateUploadName(prefix: string, ext: string): string {
  const id = randomUUID().replace(/-/g, "").slice(0, 16);
  return `${prefix}-${id}.${ext}`;
}

export function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      resolve(result.split(",")[1]);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
