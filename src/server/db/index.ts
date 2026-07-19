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
  "ALTER TABLE contents ADD COLUMN audio_url text",
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
    for (const d of seedDeities) {
      if (d.imageUrl) {
        const existing = await db.select().from(deities).where(eq(deities.slug, d.slug)).get();
        if (existing && !existing.imageUrl) {
          await db.update(deities).set({ imageUrl: d.imageUrl }).where(eq(deities.slug, d.slug)).run();
        }
      }
    }
    return;
  }

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
  if (!seeded) {
    seeded = runSeed().catch((e) => {
      seeded = null;
      throw e;
    });
  }
  return seeded;
}
