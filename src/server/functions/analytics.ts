import { createServerFn } from "@tanstack/react-start";
import { db, ensureSeeded } from "../db";
import { contents, deities, likes } from "../db/schema";
import { eq, sql, count, and } from "drizzle-orm";
import { auth } from "@clerk/tanstack-react-start/server";

export const getAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await ensureSeeded();

  const totalItems = (await db.select({ count: count() }).from(contents).get())?.count ?? 0;
  const totalLikes = (await db.select({ count: count() }).from(likes).get())?.count ?? 0;
  const publishedCount =
    (await db
      .select({ count: count() })
      .from(contents)
      .where(eq(contents.status, "published"))
      .get())?.count ?? 0;
  const draftsCount =
    (await db
      .select({ count: count() })
      .from(contents)
      .where(eq(contents.status, "draft"))
      .get())?.count ?? 0;

  const likesPerContent = await db
    .select({
      contentId: likes.contentId,
      count: count(),
      title: contents.title,
      slug: contents.slug,
      type: contents.type,
      deityName: deities.name,
    })
    .from(likes)
    .innerJoin(contents, eq(likes.contentId, contents.id))
    .innerJoin(deities, eq(contents.deityId, deities.id))
    .groupBy(likes.contentId)
    .orderBy(sql`count(*) desc`)
    .all();

  const mostActiveDeities = await db
    .select({
      deityId: deities.id,
      deityName: deities.name,
      deitySlug: deities.slug,
      contentCount: count(contents.id),
      totalLikes: count(likes.id),
    })
    .from(deities)
    .leftJoin(contents, eq(deities.id, contents.deityId))
    .leftJoin(likes, eq(contents.id, likes.contentId))
    .groupBy(deities.id, deities.name, deities.slug)
    .orderBy(count(contents.id))
    .limit(10)
    .all();

  const contentByDeity = await db
    .select({
      deityId: deities.id,
      deityName: deities.name,
      deitySlug: deities.slug,
      contentCount: count(contents.id),
      likesCount: count(likes.id),
      mantraCount: count(cnt => cnt.type === "mantra"),
      stotraCount: count(cnt => cnt.type === "stotra"),
      publishedCount: count(cnt => cnt.status === "published"),
      draftCount: count(cnt => cnt.status === "draft"),
    })
    .from(deities)
    .leftJoin(contents, eq(deities.id, contents.deityId))
    .leftJoin(likes, eq(contents.id, likes.contentId))
    .groupBy(deities.id, deities.name, deities.slug)
    .orderBy(deities.name)
    .all();

  const recentContent = await db
    .select({
      id: contents.id,
      title: contents.title,
      slug: contents.slug,
      type: contents.type,
      status: contents.status,
      deityName: deities.name,
      createdAt: contents.createdAt,
      updatedAt: contents.updatedAt,
      likeCount: count(likes.id),
    })
    .from(contents)
    .innerJoin(deities, eq(contents.deityId, deities.id))
    .leftJoin(likes, eq(contents.id, likes.contentId))
    .groupBy(contents.id, contents.title, contents.slug, contents.type, contents.status, deities.name, contents.createdAt, contents.updatedAt)
    .orderBy(contents.createdAt)
    .limit(20)
    .all();

  const contentTypeStatsRaw = await db
    .select({
      type: contents.type,
      count: count(),
    })
    .from(contents)
    .groupBy(contents.type)
    .orderBy(contents.type)
    .all();

  const totalItemsOverall = contentTypeStatsRaw.reduce((sum, item) => sum + item.count, 0);
  const contentTypeStats = contentTypeStatsRaw.map(item => ({
    type: item.type,
    count: item.count,
    percentage: totalItemsOverall > 0 ? Number(((item.count * 100) / totalItemsOverall).toFixed(1)) : 0,
  }));

  const contentStatusStatsRaw = await db
    .select({
      status: contents.status,
      count: count(),
    })
    .from(contents)
    .groupBy(contents.status)
    .orderBy(contents.status)
    .all();

  const totalStatusItems = contentStatusStatsRaw.reduce((sum, item) => sum + item.count, 0);
  const contentStatusStats = contentStatusStatsRaw.map(item => ({
    status: item.status,
    count: item.count,
    percentage: totalStatusItems > 0 ? Number(((item.count * 100) / totalStatusItems).toFixed(1)) : 0,
  }));

  return {
    totals: { totalItems, totalLikes, publishedCount, draftsCount },
    likesPerContent,
    mostActiveDeities,
    contentByDeity,
    recentContent,
    contentTypeStats,
    contentStatusStats,
  };
});
