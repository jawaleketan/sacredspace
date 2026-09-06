import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import { contents, deities, likes } from "../db/schema";
import { eq, and, ne, desc, count } from "drizzle-orm";
import { auth } from "@clerk/tanstack-react-start/server";
import sanitizeHtml from "sanitize-html";
import { enforceRateLimit } from "~/lib/rate-limit";
import { UnauthorizedError, NotFoundError, ConflictError } from "~/lib/errors";
import { contentInput, contentInputWithId, idParam } from "./validators";

const ADMIN_PAGE_SIZE = 50;

/** Sanitize HTML content to prevent XSS attacks on the server side. */
function sanitize(body: string): string {
  return sanitizeHtml(body, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
      "ul", "ol", "li", "blockquote", "pre", "code",
      "strong", "em", "b", "i", "u", "s", "sub", "sup",
      "a", "img", "span", "div", "table", "thead", "tbody",
      "tr", "th", "td", "figure", "figcaption", "mark",
    ],
    allowedAttributes: {
      "a": ["href", "title", "target", "rel"],
      "img": ["src", "alt", "title", "width", "height"],
      "*": ["class", "id"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
  });
}

export interface AdminContentPage {
  items: Array<{
    id: number;
    title: string;
    slug: string;
    type: "mantra" | "stotra";
    status: "published" | "draft";
    deityId: number;
    deityName: string;
    deitySlug: string;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Paginated admin listing — avoids loading the entire library per request. */
export const getAllContents = createServerFn({ method: "GET" })
  .validator((input: { page?: number }) => input)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new UnauthorizedError();

    const page = Math.max(1, Math.floor(data?.page ?? 1));
    const total =
      (await db.select({ count: count() }).from(contents).get())?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

    const items = await db
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
      .orderBy(desc(contents.updatedAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((page - 1) * ADMIN_PAGE_SIZE)
      .all();

    return { items, total, page, pageSize: ADMIN_PAGE_SIZE, totalPages };
  });

export const getAllDeitiesForSelect = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();
  return await db.select().from(deities).orderBy(deities.name).all();
});

/** Throws ConflictError (409) if another row already uses the slug. */
async function assertSlugAvailable(slug: string, excludeId?: number): Promise<void> {
  const where = excludeId !== undefined
    ? and(eq(contents.slug, slug), ne(contents.id, excludeId))
    : eq(contents.slug, slug);
  const clash = await db.select({ id: contents.id }).from(contents).where(where).get();
  if (clash) {
    throw new ConflictError(`Content with slug "${slug}" already exists`);
  }
}

export const createContent = createServerFn({ method: "POST" })
  .validator(contentInput)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new UnauthorizedError();
    enforceRateLimit(`admin:${userId}`, { maxRequests: 60, windowMs: 60_000 });
    await assertSlugAvailable(data.slug);
    const result = await db
      .insert(contents)
      .values({
        deityId: data.deityId,
        type: data.type,
        title: data.title,
        slug: data.slug,
        body: sanitize(data.body),
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
  .validator(contentInputWithId)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new UnauthorizedError();
    enforceRateLimit(`admin:${userId}`, { maxRequests: 60, windowMs: 60_000 });
    await assertSlugAvailable(data.slug, data.id);
    const result = await db
      .update(contents)
      .set({
        deityId: data.deityId,
        type: data.type,
        title: data.title,
        slug: data.slug,
        body: sanitize(data.body),
        transliteration: data.transliteration ?? "",
        translation: data.translation ?? "",
        description: data.description ?? "",
        status: data.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(contents.id, data.id))
      .returning()
      .get();
    return result;
  });

export const deleteContent = createServerFn({ method: "POST" })
  .validator(idParam)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new UnauthorizedError();
    enforceRateLimit(`admin:${userId}`, { maxRequests: 30, windowMs: 60_000 });
    await db.delete(likes).where(eq(likes.contentId, data)).run();
    await db.delete(contents).where(eq(contents.id, data)).run();
    return { deleted: true };
  });

export const toggleContentStatus = createServerFn({ method: "POST" })
  .validator(idParam)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new UnauthorizedError();
    enforceRateLimit(`admin:${userId}`, { maxRequests: 60, windowMs: 60_000 });
    const item = await db.select().from(contents).where(eq(contents.id, data)).get();
    if (!item) throw new NotFoundError("Content");
    const newStatus = item.status === "published" ? "draft" : "published";
    await db.update(contents)
      .set({ status: newStatus, updatedAt: new Date().toISOString() })
      .where(eq(contents.id, data))
      .run();
    return { status: newStatus };
  });