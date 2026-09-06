import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import { contents, deities } from "../db/schema";
import { eq, like, and, or, ne } from "drizzle-orm";
import { enforceRateLimit, getClientIp } from "~/lib/rate-limit";
import { NotFoundError } from "~/lib/errors";
import { idParam, slugParam, searchFilters } from "./validators";

const PUBLIC_LIMIT = { maxRequests: 120, windowMs: 60_000 };

async function rateLimitPublic() {
  enforceRateLimit(`public:${await getClientIp()}`, PUBLIC_LIMIT);
}

/** Unauthenticated — fetches all deities for public use (search filters, homepage). */
export const getAllDeities = createServerFn({ method: "GET" }).handler(async () => {
  await rateLimitPublic();
  return await db.select().from(deities).orderBy(deities.name).all();
});

export const getContentsByDeity = createServerFn({ method: "GET" })
  .validator(idParam)
  .handler(async ({ data }) => {
    await rateLimitPublic();
    return await db
      .select()
      .from(contents)
      .where(eq(contents.deityId, data))
      .orderBy(contents.title)
      .all();
  });

export const getContent = createServerFn({ method: "GET" })
  .validator(slugParam)
  .handler(async ({ data }) => {
    await rateLimitPublic();
    const content = await db
      .select()
      .from(contents)
      .where(eq(contents.slug, data))
      .get();
    if (!content) throw new NotFoundError("Content");
    return content;
  });

export const searchContents = createServerFn({ method: "GET" })
  .validator(searchFilters)
  .handler(async ({ data }) => {
    await rateLimitPublic();
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

    const orderBy = data.sortBy === "newest" ? contents.createdAt : contents.title;

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
      .orderBy(orderBy)
      .all();

    return results;
  });

// ── Mantra page helpers ───────────────────────────────────────────

/** Fetch a single content item by slug, joined with its deity. */
export const getContentBySlugWithDeity = createServerFn({ method: "GET" })
  .validator(slugParam)
  .handler(async ({ data }) => {
    await rateLimitPublic();
    const content = await db
      .select()
      .from(contents)
      .where(eq(contents.slug, data))
      .get();
    if (!content) throw new NotFoundError("Content");
    const deity = await db
      .select()
      .from(deities)
      .where(eq(deities.id, content.deityId))
      .get();
    return { content, deity };
  });

/** Fetch published sibling content items for a deity (excluding one slug). */
export const getSiblingContent = createServerFn({ method: "GET" })
  .validator((input: { deityId: number; excludeSlug: string }) => input)
  .handler(async ({ data }) => {
    await rateLimitPublic();
    return await db
      .select()
      .from(contents)
      .where(
        and(
          eq(contents.deityId, data.deityId),
          ne(contents.slug, data.excludeSlug),
          eq(contents.status, "published"),
        ),
      )
      .orderBy(contents.title)
      .all();
  });

// ── Deity page helpers ────────────────────────────────────────────

/** Fetch a single deity by slug. */
export const getDeityBySlug = createServerFn({ method: "GET" })
  .validator(slugParam)
  .handler(async ({ data }) => {
    await rateLimitPublic();
    const deity = await db
      .select()
      .from(deities)
      .where(eq(deities.slug, data))
      .get();
    if (!deity) throw new NotFoundError("Deity");
    return deity;
  });

/** Fetch all contents for a deity, sorted by type then title. */
export const getContentsByDeitySorted = createServerFn({ method: "GET" })
  .validator(idParam)
  .handler(async ({ data }) => {
    await rateLimitPublic();
    return await db
      .select()
      .from(contents)
      .where(eq(contents.deityId, data))
      .orderBy(contents.type, contents.title)
      .all();
  });
