import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import { contents, deities } from "../db/schema";
import { eq, and, count } from "drizzle-orm";
import { enforceRateLimit, getClientIp } from "~/lib/rate-limit";

export const getMantraOfDay = createServerFn({ method: "GET" }).handler(async () => {
  enforceRateLimit(`public:${await getClientIp()}`, { maxRequests: 120, windowMs: 60_000 });

  // Only published content is eligible — drafts must never be featured.
  const total =
    (await db
      .select({ c: count() })
      .from(contents)
      .where(eq(contents.status, "published"))
      .get())?.c ?? 0;
  if (total === 0) return null;

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const offset = dayOfYear % total;

  const row = await db
    .select({
      id: contents.id,
      deityId: contents.deityId,
      type: contents.type,
      title: contents.title,
      slug: contents.slug,
      status: contents.status,
      body: contents.body,
      transliteration: contents.transliteration,
      translation: contents.translation,
      description: contents.description,
      audioUrl: contents.audioUrl,
      createdAt: contents.createdAt,
      updatedAt: contents.updatedAt,
      deityName: deities.name,
      deitySlug: deities.slug,
      deityDescription: deities.description,
      deityImageUrl: deities.imageUrl,
    })
    .from(contents)
    .innerJoin(deities, eq(contents.deityId, deities.id))
    .where(and(eq(contents.status, "published")))
    .orderBy(contents.id)
    .limit(1)
    .offset(offset)
    .get();

  if (!row) return null;

  const { deityName, deitySlug, deityDescription, deityImageUrl, ...content } = row;
  const deity = {
    id: content.deityId,
    name: deityName,
    slug: deitySlug,
    description: deityDescription,
    imageUrl: deityImageUrl,
  };

  return { content, deity };
});