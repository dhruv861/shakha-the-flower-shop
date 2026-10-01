import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Local development uses a SQLite file in data/. In production, point
// DATABASE_URL at a hosted libSQL database (e.g. Turso) and set DATABASE_AUTH_TOKEN,
// or keep the file on a server with a persistent disk.
export const DATABASE_URL = process.env.DATABASE_URL ?? "file:data/shakha.db";

function createDb() {
  if (DATABASE_URL.startsWith("file:")) {
    mkdirSync(path.dirname(path.resolve(/*turbopackIgnore: true*/ DATABASE_URL.slice("file:".length))), { recursive: true });
  }
  const client = createClient({ url: DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
  return { client, db: drizzle(client, { schema }) };
}

// One connection per process; dev hot reloads would otherwise open a new one per edit.
const globalForDb = globalThis as unknown as { shakhaDb?: ReturnType<typeof createDb> };
const instance = globalForDb.shakhaDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.shakhaDb = instance;

export const db = instance.db;
export const dbClient: Client = instance.client;
export type Db = typeof db;
