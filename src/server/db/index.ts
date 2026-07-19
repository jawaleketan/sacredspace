import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

function findDb(dbDir: string): string | null {
  const p = path.resolve(dbDir, "sacredspace.db");
  return fs.existsSync(p) ? p : null;
}

function findDbPath(): string {
  const home = path.dirname(fileURLToPath(import.meta.url));
  let dir = home;
  for (let i = 0; i < 20; i++) {
    const found = findDb(dir);
    if (found) return found;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  const writable = path.resolve("/tmp", "sacredspace.db");
  if (fs.existsSync(path.dirname(writable))) return writable;
  const d = path.resolve(process.cwd(), "data");
  fs.mkdirSync(d, { recursive: true });
  return path.resolve(d, "sacredspace.db");
}

const dbPath = findDbPath();
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
