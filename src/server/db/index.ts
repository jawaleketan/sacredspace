import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

function findDbPath(): string {
  const candidates = [
    path.resolve(process.cwd(), "data", "sacredspace.db"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "sacredspace.db"),
    path.resolve(process.cwd(), "..", "data", "sacredspace.db"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const dir = path.dirname(candidates[0]);
  fs.mkdirSync(dir, { recursive: true });
  return candidates[0];
}

const dbPath = findDbPath();
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
