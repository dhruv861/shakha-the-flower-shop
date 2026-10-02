import { mkdirSync } from "node:fs";
import path from "node:path";
import { type Client, createClient as createHostedClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql/web";
import { databaseConfig, runningOnVercel } from "./config";
import * as schema from "./schema";

// Local development uses a SQLite file in data/. Hosted deployments use Turso
// (on Vercel, add it from the project's Storage tab); config.ts lists the
// variables that are read.
const config = databaseConfig();
export const DATABASE_URL = config.url;

function createDb() {
  let client: Client;
  if (config.url.startsWith("file:")) {
    if (runningOnVercel()) {
      throw new Error(
        "No hosted database. On Vercel the shop needs Turso: add it in the project's Storage tab " +
          "(it sets TURSO_DATABASE_URL and TURSO_AUTH_TOKEN), connect it to this project, then redeploy.",
      );
    }
    mkdirSync(path.dirname(path.resolve(/*turbopackIgnore: true*/ config.url.slice("file:".length))), { recursive: true });
    // The local SQLite engine is a native module, so it's loaded only for file
    // databases. Hosted ones use the pure-JavaScript client, which needs no
    // platform binary on serverless hosts.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const local = require("@libsql/client") as typeof import("@libsql/client");
    client = local.createClient({ url: config.url });
  } else {
    client = createHostedClient({ url: config.url, authToken: config.authToken });
  }
  return { client, db: drizzle(client, { schema }) };
}

// One connection per process; dev hot reloads would otherwise open a new one per edit.
const globalForDb = globalThis as unknown as { shakhaDb?: ReturnType<typeof createDb> };
const instance = globalForDb.shakhaDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.shakhaDb = instance;

export const db = instance.db;
export const dbClient: Client = instance.client;
export type Db = typeof db;
