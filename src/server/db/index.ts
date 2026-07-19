import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, count } from "drizzle-orm";
import * as schema from "./schema";
import { deities, contents } from "./schema";
import { seedDeities, seedContents } from "./seed-data";

const isVercel = !!process.env.VERCEL;
const url = process.env.TURSO_DATABASE_URL ?? (isVercel ? "file:/tmp/sacredspace.db" : "file:./data/sacredspace.db");
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient(
  authToken ? { url, authToken } : { url }
);

client.execute("PRAGMA journal_mode = WAL").catch(() => {});

export const db = drizzle(client, { schema });

let seeded: Promise<void> | undefined;

async function runSeed() {
  const row = await db.select({ c: count() }).from(deities).get();
  if (row && row.c > 0) return;

  const slugToId: Record<string, number> = {};
  for (const d of seedDeities) {
    const r = await db.insert(deities).values(d).returning().get();
    slugToId[r.slug] = r.id;
  }
  for (const c of seedContents) {
    const did = slugToId[c.deitySlug];
    if (!did) continue;
    await db.insert(contents).values({
      deityId: did, type: c.type, title: c.title, slug: c.slug,
      body: c.body, transliteration: c.transliteration,
      translation: c.translation, description: c.description,
    }).run();
  }
}

export function ensureSeeded() {
  if (!seeded) seeded = runSeed();
  return seeded;
}

// On Vercel (local sqlite, no Turso), pre-seed the DB
if (isVercel && !process.env.TURSO_DATABASE_URL) ensureSeeded();
