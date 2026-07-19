import { createServerFn } from "@tanstack/react-start";
import { db, ensureSeeded } from "../db";
import { contents, deities } from "../db/schema";
import { eq } from "drizzle-orm";

const now = new Date();
const startOfYear = new Date(now.getFullYear(), 0, 0);
const diff = now.getTime() - startOfYear.getTime();
const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

export const getMantraOfDay = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  const all = await db.select().from(contents).all();
  if (all.length === 0) return null;
  const idx = dayOfYear % all.length;
  const content = all[idx];
  const deity = await db.select().from(deities).where(eq(deities.id, content.deityId)).get();
  return { content, deity };
});
