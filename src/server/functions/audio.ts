import { createServerFn } from "@tanstack/react-start";
import { db, ensureSeeded } from "../db";
import { contents } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/tanstack-react-start/server";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { validateAudioUpload, generateUploadName } from "~/lib/upload";

export const uploadContentAudio = createServerFn({ method: "POST" })
  .validator((data: { contentSlug: string; audioBase64: string; fileName: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await ensureSeeded();

    const { buffer, ext } = validateAudioUpload(data.audioBase64);
    const name = generateUploadName("audio", ext);
    const uploadDir = path.resolve("public/uploads");
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, name), buffer);

    const audioUrl = `/uploads/${name}`;
    await db.update(contents).set({ audioUrl }).where(eq(contents.slug, data.contentSlug)).run();
    return { audioUrl };
  });

export const removeContentAudio = createServerFn({ method: "POST" })
  .validator((slug: string) => slug)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await ensureSeeded();
    await db.update(contents).set({ audioUrl: null }).where(eq(contents.slug, data)).run();
    return { ok: true };
  });
