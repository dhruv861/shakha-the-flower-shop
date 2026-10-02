import "./scripts/load-env";
import { defineConfig } from "drizzle-kit";
import { databaseConfig } from "./src/db/config";

const { url, authToken } = databaseConfig();

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url, authToken },
});
