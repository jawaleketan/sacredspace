import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, count } from "drizzle-orm";
import * as schema from "./schema";
import { deities, contents } from "./schema";
import { seedDeities, seedContents } from "./seed-data";
import { validateEnv } from "~/lib/env";

validateEnv();

// `VERCEL=1` is also set by nitro's vercel-preset dev emulation locally, so it
// alone is not proof of a real serverless deployment — check the working
// directory, which on real Vercel lambdas lives under /var/task.
const isProduction =
  process.env.NODE_ENV === "production" ||
  (!!process.env.VERCEL && process.cwd().startsWith("/var/task"));
const url = process.env.TURSO_DATABASE_URL;

if (!url) {
  if (isProduction) {
    // Serverless filesystems are ephemeral — a local SQLite file in /tmp is
    // wiped on every cold start, silently discarding all admin-created data.
    // Refuse to start with a database that will lose data.
    throw new Error(
      "TURSO_DATABASE_URL is required in production. " +
        "The previous fallback used an ephemeral /tmp SQLite file that loses all data on cold start. " +
        "Create a Turso database and set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN. " +
        "See sacredspace/.env.example."
    );
  }
  // Local dev: a local file database is fine.
  console.warn("TURSO_DATABASE_URL not set — using local file database ./data/sacredspace.db");
}

const dbUrl = url ?? "file:./data/sacredspace.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

// Turso remote databases require an auth token; connecting without one would
// fail at first query with a confusing auth error instead of at startup.
if (url && !authToken && !url.startsWith("file:")) {
  throw new Error(
    "TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL points to a remote database. See sacredspace/.env.example."
  );
}

export const client = createClient(
  authToken ? { url: dbUrl, authToken } : { url: dbUrl }
);

// WAL only applies to local file databases; remote Turso rejects PRAGMA
// statements over its HTTP API (SQL_PARSE_ERROR).
if (dbUrl.startsWith("file:")) {
  client.execute("PRAGMA journal_mode = WAL").catch((e) => { console.error("WAL pragma failed", e); });
}

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
  // FTS5 virtual table for content search. Kept in sync with the contents
  // table by the triggers below; rebuilt from scratch at startup (cheap at
  // current scale) so the index is always consistent with the source rows.
  `CREATE VIRTUAL TABLE IF NOT EXISTS contents_fts USING fts5(
    title, description, transliteration, translation,
    content='contents', content_rowid='id'
  )`,
  // Trigger set copied from the SQLite FTS5 external-content docs.
  `CREATE TRIGGER IF NOT EXISTS contents_fts_insert AFTER INSERT ON contents BEGIN
    INSERT INTO contents_fts(rowid, title, description, transliteration, translation)
    VALUES (new.id, new.title, new.description, new.transliteration, new.translation);
  END`,
  `CREATE TRIGGER IF NOT EXISTS contents_fts_delete AFTER DELETE ON contents BEGIN
    INSERT INTO contents_fts(contents_fts, rowid, title, description, transliteration, translation)
    VALUES ('delete', old.id, old.title, old.description, old.transliteration, old.translation);
  END`,
  `CREATE TRIGGER IF NOT EXISTS contents_fts_update AFTER UPDATE ON contents BEGIN
    INSERT INTO contents_fts(contents_fts, rowid, title, description, transliteration, translation)
    VALUES ('delete', old.id, old.title, old.description, old.transliteration, old.translation);
    INSERT INTO contents_fts(rowid, title, description, transliteration, translation)
    VALUES (new.id, new.title, new.description, new.transliteration, new.translation);
  END`,
];

/**
 * Rebuild the FTS index from the contents table at startup. Triggers keep it
 * in sync afterwards; the rebuild covers rows written before the index
 * existed (or by tooling that bypasses the triggers).
 */
async function rebuildSearchIndex() {
  await client.execute("INSERT INTO contents_fts(contents_fts) VALUES ('rebuild')");
}

async function runSeed() {
  const statements = migrationSQL.split(";").map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await client.execute(stmt + ";");
  }
  for (const m of migrations) {
    try { await client.execute(m); } catch (e) { console.error("Migration failed", m, e); }
  }
  try { await rebuildSearchIndex(); } catch (e) { console.error("FTS index rebuild failed (search falls back to LIKE)", e); }

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
