import "server-only";

// App code imports the database from here, which keeps it out of client bundles.
// Scripts (seed, migrations, create-admin) import ./client directly.
export { db } from "./client";
export * from "./schema";
