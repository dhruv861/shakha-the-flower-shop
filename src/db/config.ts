// Where the database lives, read from the environment. Kept free of imports so
// the app, the scripts, drizzle.config.ts and the tests can all share it.
//
//   1. DATABASE_URL (+ DATABASE_AUTH_TOKEN), set by hand: a SQLite file
//      (file:…) or a Turso/libSQL URL (libsql://…).
//   2. TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN), created by Vercel's Turso
//      integration, also under whatever prefix was chosen when connecting it
//      (e.g. SHOP_TURSO_DATABASE_URL + SHOP_TURSO_AUTH_TOKEN).
//   3. Any other variable holding a libsql:// URL, with its token beside it.
//   4. Otherwise a SQLite file in data/, for local development.

type Env = Record<string, string | undefined>;

export type DatabaseConfig = {
  url: string;
  authToken?: string;
  /** Which variable the URL came from (never the token), for messages. */
  source: string;
};

export const LOCAL_DATABASE = "file:data/shakha.db";

const HOSTED = /^(libsql|https?|wss?):\/\//;

/** The token that sits beside a URL variable: X_TURSO_DATABASE_URL → X_TURSO_AUTH_TOKEN, X_URL → X_AUTH_TOKEN. */
function tokenFor(urlKey: string, env: Env) {
  const base = urlKey.replace(/(DATABASE_)?URL$/, "");
  for (const key of [`${base}AUTH_TOKEN`, `${base}DATABASE_AUTH_TOKEN`, `${base}TOKEN`]) {
    if (env[key]) return env[key];
  }
  return undefined;
}

export function databaseConfig(env: Env = process.env): DatabaseConfig {
  const explicit = env.DATABASE_URL?.trim();
  if (explicit && (explicit.startsWith("file:") || HOSTED.test(explicit))) {
    return { url: explicit, authToken: env.DATABASE_AUTH_TOKEN || undefined, source: "DATABASE_URL" };
  }

  // Shortest name first, so an unprefixed TURSO_DATABASE_URL wins over prefixed copies.
  const keys = Object.keys(env).sort((a, b) => a.length - b.length || a.localeCompare(b));
  const turso = keys.find((k) => /(^|_)TURSO_DATABASE_URL$/.test(k) && HOSTED.test(env[k]?.trim() ?? ""));
  const anyLibsql = keys.find((k) => k !== "DATABASE_URL" && env[k]?.trim().startsWith("libsql://"));
  const key = turso ?? anyLibsql;
  if (key) return { url: env[key]!.trim(), authToken: tokenFor(key, env), source: key };

  if (explicit) {
    throw new Error(
      `DATABASE_URL must be a Turso/libSQL URL (libsql://…) or a SQLite file (file:…), but it starts with "${explicit.split(":")[0]}:".`,
    );
  }
  return { url: LOCAL_DATABASE, source: "default" };
}
