import { createServerFn } from "@tanstack/react-start";
import { db, ensureSeeded } from "../db";
import { contents } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/tanstack-react-start/server";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const uploadContentAudio = createServerFn({ method: "POST" })
  .validator((data: { contentSlug: string; audioBase64: string; fileName: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await ensureSeeded();

    const ext = path.extname(data.fileName) || ".mp3";
    const name = `content-${data.contentSlug}-${Date.now()}${ext}`;
    const uploadDir = path.resolve("public/uploads");
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(data.audioBase64, "base64");
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
    await db.update(contents).set({ audioUrl: null }).where(eq(contents.slug, data)).run();
    return { ok: true };
  });
