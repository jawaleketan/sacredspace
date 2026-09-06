import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { db } from "../db";
import { likes } from "../db/schema";
import { eq, and, count } from "drizzle-orm";
import { enforceRateLimit } from "~/lib/rate-limit";
import { idParam } from "./validators";

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
  .validator(idParam)
  .handler(async ({ data }) => {
    const sessionId = getSessionId();

    // Rate limit: 30 likes per minute per session
    enforceRateLimit(`like:${sessionId}`, {
      maxRequests: 30,
      windowMs: 60_000,
    });
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
  .validator(idParam)
  .handler(async ({ data }) => {
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
  .validator(idParam)
  .handler(async ({ data }) => {
    const result = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.contentId, data))
      .get();
    return result?.count ?? 0;
  });