import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL ?? "file:./data/sacredspace.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient(
  authToken ? { url, authToken } : { url }
);

client.execute("PRAGMA journal_mode = WAL").catch(() => {});

export const db = drizzle(client, { schema });
