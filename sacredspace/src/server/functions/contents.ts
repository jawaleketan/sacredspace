import { createServerFn } from "@tanstack/react-start";
import { db, client } from "../db";
import { contents, deities } from "../db/schema";
import { eq, like, and, or, ne } from "drizzle-orm";
import { enforceRateLimit, getClientIp } from "~/lib/rate-limit";
import { NotFoundError } from "~/lib/errors";
import { idParam, slugParam, searchFilters } from "./validators";

const PUBLIC_LIMIT = { maxRequests: 120, windowMs: 60_000 };

async function rateLimitPublic() {
  await enforceRateLimit(`public:${await getClientIp()}`, PUBLIC_LIMIT);
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

/**
 * Build the FTS5 MATCH expression for a user query. Each whitespace-separated
 * term is double-quoted (FTS5 string syntax) and suffixed with `*` for prefix
 * matching, so user input can never inject query syntax like NOT/OR/NEAR or
 * column filters.
 */
export function buildFtsQuery(input: string): string {
  const terms = input.trim().split(/\s+/).filter(Boolean);
  return terms.map((t) => `"${t.replace(/"/g, "")}"*`).join(" ");
}

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  type: string;
  description: string | null;
  deityId: number;
  deityName: string;
  deitySlug: string;
}

export const searchContents = createServerFn({ method: "GET" })
  .validator(searchFilters)
  .handler(async ({ data }) => {
    await rateLimitPublic();

    // Resolve the deity filter once (shared by both query paths).
    let deityId: number | undefined;
    if (data.deitySlug) {
      const deity = await db
        .select({ id: deities.id })
        .from(deities)
        .where(eq(deities.slug, data.deitySlug))
        .get();
      if (deity) deityId = deity.id;
    }

    const typeCondition = data.type ? eq(contents.type, data.type) : undefined;
    const deityCondition = deityId ? eq(contents.deityId, deityId) : undefined;
    const where =
      typeCondition && deityCondition ? and(typeCondition, deityCondition)
      : typeCondition ?? deityCondition;

    // No text query — plain listing ordered by title.
    if (!data.query) {
      return await db
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
    }

    // Text query — full-text search across title, description,
    // transliteration, and translation via the contents_fts index,
    // BM25-ranked for multi-term queries. Falls back to LIKE if the FTS
    // machinery is unavailable.
    const ftsQuery = buildFtsQuery(data.query);
    const filterSql: string[] = [];
    const args: (string | number)[] = [ftsQuery];
    if (data.type) {
      filterSql.push("AND c.type = ?");
      args.push(data.type);
    }
    if (deityId !== undefined) {
      filterSql.push("AND c.deity_id = ?");
      args.push(deityId);
    }
    const orderSql = data.sortBy === "newest" ? "c.created_at DESC" : "rank, c.title COLLATE NOCASE";

    try {
      const rows = await client.execute({
        sql: `SELECT c.id, c.title, c.slug, c.type, c.description,
                     c.deity_id AS deityId, d.name AS deityName, d.slug AS deitySlug
              FROM contents_fts f
              JOIN contents c ON c.id = f.rowid
              JOIN deities d ON d.id = c.deity_id
              WHERE contents_fts MATCH ? ${filterSql.join(" ")}
              ORDER BY ${orderSql}`,
        args,
      });
      return rows.rows.map((r): SearchResult => ({
        id: Number(r.id),
        title: String(r.title),
        slug: String(r.slug),
        type: String(r.type),
        description: r.description == null ? null : String(r.description),
        deityId: Number(r.deityId),
        deityName: String(r.deityName),
        deitySlug: String(r.deitySlug),
      }));
    } catch (e) {
      console.error("FTS search failed — falling back to LIKE", e);
    }

    // LIKE fallback: same shape as the original implementation.
    const likeCondition = or(
      like(contents.title, `%${data.query}%`),
      like(contents.description ?? "", `%${data.query}%`),
    );
    const fallbackWhere =
      where && likeCondition ? and(where, likeCondition) : likeCondition;
    const orderBy = data.sortBy === "newest" ? contents.createdAt : contents.title;
    return await db
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
      .where(fallbackWhere)
      .orderBy(orderBy)
      .all();
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
