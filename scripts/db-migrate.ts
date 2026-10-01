// Applies any pending migrations from drizzle/ to the database. Safe to run
// repeatedly; `npm run dev` and `npm run build` run it first.
import "./load-env";
import { migrate } from "drizzle-orm/libsql/migrator";
import { DATABASE_URL, db, dbClient } from "../src/db/client";

async function main() {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log(`Database ready (${DATABASE_URL.startsWith("file:") ? DATABASE_URL : "remote libSQL"})`);
  dbClient.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
