import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import { contents, deities } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { enforceRateLimit, getClientIp } from "~/lib/rate-limit";
import { savedIds } from "./validators";

export const getSavedContents = createServerFn({ method: "POST" })
  .validator(savedIds)
  .handler(async ({ data }) => {
    enforceRateLimit(`public:${await getClientIp()}`, { maxRequests: 120, windowMs: 60_000 });
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
