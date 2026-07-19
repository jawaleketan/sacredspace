import { createServerFn } from "@tanstack/react-start";
import { db, ensureSeeded } from "../db";
import { contents, deities } from "../db/schema";
import { eq, like, and, or, sql } from "drizzle-orm";

export const getContentsByDeity = createServerFn({ method: "GET" })
  .validator((deityId: number) => deityId)
  .handler(async ({ data }) => {
    await ensureSeeded();
    return await db
      .select()
      .from(contents)
      .where(eq(contents.deityId, data))
      .orderBy(contents.title)
      .all();
  });

export const getContent = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data }) => {
    await ensureSeeded();
    const content = await db
      .select()
      .from(contents)
      .where(eq(contents.slug, data))
      .get();
    if (!content) throw new Error("Content not found");
    return content;
  });

export interface SearchFilters {
  query: string;
  deitySlug?: string;
  type?: "mantra" | "stotra";
}

export const searchContents = createServerFn({ method: "GET" })
  .validator((filters: SearchFilters) => filters)
  .handler(async ({ data }) => {
    await ensureSeeded();
    const conditions = [];

    if (data.query) {
      conditions.push(
        or(
          like(contents.title, `%${data.query}%`),
          like(contents.description ?? "", `%${data.query}%`),
        ),
      );
    }

    if (data.type) {
      conditions.push(eq(contents.type, data.type));
    }

    if (data.deitySlug) {
      const deity = await db
        .select()
        .from(deities)
        .where(eq(deities.slug, data.deitySlug))
        .get();
      if (deity) {
        conditions.push(eq(contents.deityId, deity.id));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: contents.id,
        title: contents.title,
        slug: contents.slug,
        type: contents.type,
        description: contents.description,
        deityId: contents.deityId,
        deityName: deities.name,
        deitySlug: deities.slug,
      })
      .from(contents)
      .innerJoin(deities, eq(contents.deityId, deities.id))
      .where(where)
      .orderBy(contents.title)
      .all();

    return results;
  });
