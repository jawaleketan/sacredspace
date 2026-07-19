import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

function findDbPath(): string {
  const candidates = [
    path.resolve(process.cwd(), "data", "sacredspace.db"),
    path.resolve(process.cwd(), "..", "data", "sacredspace.db"),
    path.resolve(process.cwd(), "..", "..", "data", "sacredspace.db"),
    path.resolve("/var/task", "data", "sacredspace.db"),
    path.resolve("/var/task/__server.func", "data", "sacredspace.db"),
    path.resolve("/var/task/.vercel/output/functions/__server.func", "data", "sacredspace.db"),
    "/tmp/sacredspace.db",
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  return "/tmp/sacredspace.db";
}

const dbPath = findDbPath();
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
