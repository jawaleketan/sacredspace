import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, count } from "drizzle-orm";
import * as schema from "./schema";
import { deities, contents } from "./schema";
import { seedDeities, seedContents } from "./seed-data";
import { validateEnv } from "~/lib/env";

validateEnv();

const isVercel = !!process.env.VERCEL;
const url = process.env.TURSO_DATABASE_URL ?? (isVercel ? "file:/tmp/sacredspace.db" : "file:./data/sacredspace.db");
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient(
  authToken ? { url, authToken } : { url }
);

client.execute("PRAGMA journal_mode = WAL").catch((e) => { console.error("WAL pragma failed", e); });

export const db = drizzle(client, { schema });

const migrationSQL = `CREATE TABLE IF NOT EXISTS contents (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  deity_id integer NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  status text DEFAULT 'published' NOT NULL,
  body text NOT NULL,
  transliteration text,
  translation text,
  description text,
  audio_url text,
  created_at text NOT NULL,
  updated_at text NOT NULL,
  FOREIGN KEY (deity_id) REFERENCES deities(id) ON UPDATE no action ON DELETE no action
);
CREATE TABLE IF NOT EXISTS deities (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  image_url text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS deities_slug_unique ON deities (slug);
CREATE UNIQUE INDEX IF NOT EXISTS contents_slug_unique ON contents (slug);
CREATE TABLE IF NOT EXISTS likes (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  content_id integer NOT NULL,
  session_id text NOT NULL,
  created_at text NOT NULL,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON UPDATE no action ON DELETE no action
);`;

let seeded: Promise<void> | null = null;

const migrations = [
  "CREATE UNIQUE INDEX IF NOT EXISTS likes_content_id_session_id_unique ON likes (content_id, session_id)",
];

async function runSeed() {
  const statements = migrationSQL.split(";").map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await client.execute(stmt + ";");
  }
  for (const m of migrations) {
    try { await client.execute(m); } catch (e) { console.error("Migration failed", m, e); }
  }

  const row = await db.select({ c: count() }).from(deities).get();
  if (row && row.c > 0) {
    // Backfill image URLs for existing deities that are missing them
    const deitiesWithImages = seedDeities.filter((d) => d.imageUrl);
    if (deitiesWithImages.length > 0) {
      const existing = await db.select().from(deities).all();
      const existingMap = new Map(existing.map((d) => [d.slug, d]));
      const updates = deitiesWithImages.filter((d) => {
        const e = existingMap.get(d.slug);
        return e && !e.imageUrl;
      });
      for (const d of updates) {
        await db.update(deities).set({ imageUrl: d.imageUrl }).where(eq(deities.slug, d.slug)).run();
      }
    }
    return;
  }

  // Batch insert all deities at once
  const insertedDeities = await db.insert(deities).values(seedDeities).returning();
  const slugToId = new Map(insertedDeities.map((d) => [d.slug, d.id]));

  // Batch insert all contents at once
  const contentsToInsert = seedContents
    .filter((c) => slugToId.has(c.deitySlug))
    .map((c) => ({
      deityId: slugToId.get(c.deitySlug)!,
      type: c.type,
      title: c.title,
      slug: c.slug,
      body: c.body,
      transliteration: c.transliteration,
      translation: c.translation,
      description: c.description,
    }));

  if (contentsToInsert.length > 0) {
    await db.insert(contents).values(contentsToInsert).run();
  }
}

export function ensureSeeded() {
  if (!seeded) {
    seeded = runSeed().catch((e) => {
      seeded = null;
      throw e;
    });
  }
  return seeded;
}

// Kick off seeding at module load so it runs once per cold start,
// not on every individual request.
// validateEnv() runs above at module load to catch missing Clerk keys early.
ensureSeeded();
