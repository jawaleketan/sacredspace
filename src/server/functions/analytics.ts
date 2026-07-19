import { createServerFn } from "@tanstack/react-start";
import { db, ensureSeeded } from "../db";
import { contents, deities, likes } from "../db/schema";
import { eq, sql, count } from "drizzle-orm";
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

  return { totalItems, totalLikes, publishedCount, draftsCount, likesPerContent };
});
