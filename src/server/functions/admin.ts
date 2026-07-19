import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import { contents, deities } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/tanstack-react-start/server";

export const getAllContents = createServerFn({ method: "GET" }).handler(async () => {
  return await db
    .select({
      id: contents.id,
      title: contents.title,
      slug: contents.slug,
      type: contents.type,
      status: contents.status,
      deityId: contents.deityId,
      deityName: deities.name,
      deitySlug: deities.slug,
      createdAt: contents.createdAt,
      updatedAt: contents.updatedAt,
    })
    .from(contents)
    .innerJoin(deities, eq(contents.deityId, deities.id))
    .orderBy(contents.updatedAt)
    .all();
});

export const getAllDeitiesForSelect = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(deities).orderBy(deities.name).all();
});

export interface ContentInput {
  deityId: number;
  type: "mantra" | "stotra";
  title: string;
  slug: string;
  body: string;
  transliteration?: string;
  translation?: string;
  description?: string;
  status: "published" | "draft";
}

export const createContent = createServerFn({ method: "POST" })
  .validator((input: ContentInput) => input)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const result = await db
      .insert(contents)
      .values({
        deityId: data.deityId,
        type: data.type,
        title: data.title,
        slug: data.slug,
        body: data.body,
        transliteration: data.transliteration ?? "",
        translation: data.translation ?? "",
        description: data.description ?? "",
        status: data.status,
      })
      .returning()
      .get();
    return result;
  });

export const updateContent = createServerFn({ method: "POST" })
  .validator((input: ContentInput & { id: number }) => input)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const result = await db
      .update(contents)
      .set({
        deityId: data.deityId,
        type: data.type,
        title: data.title,
        slug: data.slug,
        body: data.body,
        transliteration: data.transliteration ?? "",
        translation: data.translation ?? "",
        description: data.description ?? "",
        status: data.status,
      })
      .where(eq(contents.id, data.id))
      .returning()
      .get();
    return result;
  });

export const deleteContent = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await db.delete(contents).where(eq(contents.id, data)).run();
    return { deleted: true };
  });

export const toggleContentStatus = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const item = await db.select().from(contents).where(eq(contents.id, data)).get();
    if (!item) throw new Error("Not found");
    const newStatus = item.status === "published" ? "draft" : "published";
    await db.update(contents)
      .set({ status: newStatus })
      .where(eq(contents.id, data))
      .run();
    return { status: newStatus };
  });
