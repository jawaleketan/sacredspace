import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";

async function getDb() {
  const [{ ensureSeeded, db }, { likes }, { eq, and, count }] = await Promise.all([
    import("../db"),
    import("../db/schema"),
    import("drizzle-orm"),
  ]);
  return { ensureSeeded, db, likes, eq, and, count };
}

function getSessionId(): string {
  let sessionId = getCookie("session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    setCookie("session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return sessionId;
}

export const toggleLike = createServerFn({ method: "POST" })
  .validator((contentId: number) => contentId)
  .handler(async ({ data }) => {
    const { ensureSeeded, db, likes, eq, and } = await getDb();
    await ensureSeeded();
    const sessionId = getSessionId();
    const existing = await db
      .select()
      .from(likes)
      .where(
        and(eq(likes.contentId, data), eq(likes.sessionId, sessionId)),
      )
      .get();

    if (existing) {
      await db.delete(likes)
        .where(eq(likes.id, existing.id))
        .run();
      return { liked: false };
    }

    await db.insert(likes)
      .values({ contentId: data, sessionId })
      .run();
    return { liked: true };
  });

export const getLikeStatus = createServerFn({ method: "GET" })
  .validator((contentId: number) => contentId)
  .handler(async ({ data }) => {
    const { ensureSeeded, db, likes, eq, and } = await getDb();
    await ensureSeeded();
    const sessionId = getSessionId();
    const existing = await db
      .select()
      .from(likes)
      .where(
        and(eq(likes.contentId, data), eq(likes.sessionId, sessionId)),
      )
      .get();
    return { liked: !!existing };
  });

export const getLikeCount = createServerFn({ method: "GET" })
  .validator((contentId: number) => contentId)
  .handler(async ({ data }) => {
    const { ensureSeeded, db, likes, eq, count } = await getDb();
    await ensureSeeded();
    const result = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.contentId, data))
      .get();
    return result?.count ?? 0;
  });
