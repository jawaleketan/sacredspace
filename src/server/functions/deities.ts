import { createServerFn } from "@tanstack/react-start";
import { db, ensureSeeded } from "../db";
import { deities, contents, likes } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@clerk/tanstack-react-start/server";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { validateImageUpload, generateUploadName } from "~/lib/upload";

export const getAllDeities = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  return await db.select().from(deities).orderBy(deities.name).all();
});

export const updateDeityImage = createServerFn({ method: "POST" })
  .validator((data: { deityId: number; imageBase64: string; fileName: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await ensureSeeded();

    const { buffer, ext } = validateImageUpload(data.imageBase64);
    const name = generateUploadName("deity", ext);
    const uploadDir = path.resolve("public/uploads");
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, name), buffer);

    const imageUrl = `/uploads/${name}`;
    await db.update(deities).set({ imageUrl }).where(eq(deities.id, data.deityId)).run();
    return { imageUrl };
  });

export const updateDeity = createServerFn({ method: "POST" })
  .validator((data: { id: number; name: string; slug: string; description: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await ensureSeeded();
    await db.update(deities)
      .set({ name: data.name, slug: data.slug, description: data.description, updatedAt: new Date().toISOString() })
      .where(eq(deities.id, data.id))
      .run();
    return { ok: true };
  });

export const removeDeityImage = createServerFn({ method: "POST" })
  .validator((deityId: number) => deityId)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await db.update(deities).set({ imageUrl: null }).where(eq(deities.id, data)).run();
    return { ok: true };
  });

export const deleteDeity = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const related = await db.select({ id: contents.id }).from(contents).where(eq(contents.deityId, data)).all();
    const contentIds = related.map((c) => c.id);
    if (contentIds.length > 0) {
      await db.delete(likes).where(inArray(likes.contentId, contentIds)).run();
      await db.delete(contents).where(inArray(contents.id, contentIds)).run();
    }
    await db.delete(deities).where(eq(deities.id, data)).run();
    return { deleted: true };
  });

export const createDeity = createServerFn({ method: "POST" })
  .validator((data: { name: string; slug: string; description: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const result = await db
      .insert(deities)
      .values({ name: data.name, slug: data.slug, description: data.description })
      .returning()
      .get();
    return result;
  });
