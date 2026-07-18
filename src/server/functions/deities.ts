import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import { deities } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/tanstack-react-start/server";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const getAllDeities = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(deities).orderBy(deities.name).all();
});

export const updateDeityImage = createServerFn({ method: "POST" })
  .validator((data: { deityId: number; imageBase64: string; fileName: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const ext = path.extname(data.fileName) || ".png";
    const name = `deity-${data.deityId}-${Date.now()}${ext}`;
    const uploadDir = path.resolve("public/uploads");
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(data.imageBase64, "base64");
    await writeFile(path.join(uploadDir, name), buffer);

    const imageUrl = `/uploads/${name}`;
    db.update(deities).set({ imageUrl }).where(eq(deities.id, data.deityId)).run();
    return { imageUrl };
  });

export const updateDeity = createServerFn({ method: "POST" })
  .validator((data: { id: number; name: string; slug: string; description: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    db.update(deities)
      .set({ name: data.name, slug: data.slug, description: data.description })
      .where(eq(deities.id, data.id))
      .run();
    return { ok: true };
  });

export const removeDeityImage = createServerFn({ method: "POST" })
  .validator((deityId: number) => deityId)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    db.update(deities).set({ imageUrl: null }).where(eq(deities.id, data)).run();
    return { ok: true };
  });

export const deleteDeity = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    db.delete(deities).where(eq(deities.id, data)).run();
    return { deleted: true };
  });

export const createDeity = createServerFn({ method: "POST" })
  .validator((data: { name: string; slug: string; description: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const result = db
      .insert(deities)
      .values({ name: data.name, slug: data.slug, description: data.description })
      .returning()
      .get();
    return result;
  });
