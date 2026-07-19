import { createServerFn } from "@tanstack/react-start";
import { db, ensureSeeded } from "../db";
import { contents, deities } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

export const getSavedContents = createServerFn({ method: "POST" })
  .validator((ids: number[]) => ids)
  .handler(async ({ data }) => {
    await ensureSeeded();
    if (data.length === 0) return [];
    return await db
      .select({
        id: contents.id,
        title: contents.title,
        slug: contents.slug,
        type: contents.type,
        description: contents.description,
        deityName: deities.name,
        deitySlug: deities.slug,
      })
      .from(contents)
      .innerJoin(deities, eq(contents.deityId, deities.id))
      .where(inArray(contents.id, data))
      .orderBy(contents.title)
      .all();
  });
