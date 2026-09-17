import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import { deities, contents, likes } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { validateImageUpload, generateUploadName } from "~/lib/upload";
import { storeFile, deleteStoredFile } from "~/lib/storage";
import { ConflictError } from "~/lib/errors";
import { requireAdmin } from "./admin-auth";
import { idParam, deityCreate, deityUpdate, imageUpload } from "./validators";

export const updateDeityImage = createServerFn({ method: "POST" })
  .validator(imageUpload)
  .handler(async ({ data }) => {
    await requireAdmin();

    const { buffer, ext, mime } = validateImageUpload(data.imageBase64);
    const name = generateUploadName("deity", ext);
    const { url } = await storeFile(name, buffer, mime);

    // Clean up the previous image (Blob only — seed/local images are kept).
    const previous = await db.select({ imageUrl: deities.imageUrl }).from(deities).where(eq(deities.id, data.deityId)).get();
    await deleteStoredFile(previous?.imageUrl);

    await db.update(deities).set({ imageUrl: url }).where(eq(deities.id, data.deityId)).run();
    return { imageUrl: url };
  });

export const updateDeity = createServerFn({ method: "POST" })
  .validator(deityUpdate)
  .handler(async ({ data }) => {
    await requireAdmin();

    // Slug is unique at the DB level — pre-check so the user gets a
    // friendly 409 instead of a raw constraint-error 500. If the row
    // keeping its own slug, the check passes (same id).
    const clash = await db.select({ id: deities.id }).from(deities).where(eq(deities.slug, data.slug)).get();
    if (clash && clash.id !== data.id) {
      throw new ConflictError(`A deity with slug "${data.slug}" already exists`);
    }

    await db.update(deities)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(deities.id, data.id))
      .run();
    return { ok: true };
  });

export const removeDeityImage = createServerFn({ method: "POST" })
  .validator(idParam)
  .handler(async ({ data }) => {
    await requireAdmin();

    // Delete the uploaded Blob file (if any) before clearing the reference.
    const existing = await db.select({ imageUrl: deities.imageUrl }).from(deities).where(eq(deities.id, data)).get();
    await deleteStoredFile(existing?.imageUrl);

    await db.update(deities).set({ imageUrl: null }).where(eq(deities.id, data)).run();
    return { ok: true };
  });

export const deleteDeity = createServerFn({ method: "POST" })
  .validator(idParam)
  .handler(async ({ data }) => {
    await requireAdmin();

    const deity = await db.select({ imageUrl: deities.imageUrl }).from(deities).where(eq(deities.id, data)).get();
    const related = await db.select({ id: contents.id, audioUrl: contents.audioUrl }).from(contents).where(eq(contents.deityId, data)).all();
    const contentIds = related.map((c) => c.id);
    if (contentIds.length > 0) {
      await db.delete(likes).where(inArray(likes.contentId, contentIds)).run();
      await db.delete(contents).where(inArray(contents.id, contentIds)).run();
    }
    await db.delete(deities).where(eq(deities.id, data)).run();

    // Rows are gone — best-effort delete of the uploaded Blob files.
    // (Local/seed files under public/uploads/ are intentionally kept.)
    await deleteStoredFile(deity?.imageUrl);
    await Promise.all(related.filter((c) => c.audioUrl).map((c) => deleteStoredFile(c.audioUrl)));

    return { deleted: true };
  });

export const createDeity = createServerFn({ method: "POST" })
  .validator(deityCreate)
  .handler(async ({ data }) => {
    await requireAdmin();

    // Slug is unique at the DB level — pre-check for a friendly 409.
    const clash = await db.select({ id: deities.id }).from(deities).where(eq(deities.slug, data.slug)).get();
    if (clash) {
      throw new ConflictError(`A deity with slug "${data.slug}" already exists`);
    }

    const result = await db
      .insert(deities)
      .values({ name: data.name, slug: data.slug, description: data.description })
      .returning()
      .get();
    return result;
  });