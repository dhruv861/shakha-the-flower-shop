// Creates an admin login, or resets the password of an existing one.
//
//   npm run admin:create -- --email owner@example.com --name "Owner"
//   npm run admin:create -- --email owner@example.com --password "…"
//
// Without --password, a strong random password is generated and printed once.

import "./load-env";
import { eq } from "drizzle-orm";
import { admins, sessions } from "../src/db/schema";
import { db, dbClient } from "../src/db/client";
import { generatePassword, hashPassword } from "../src/lib/password";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage: npm run admin:create -- --email you@example.com [--name "Your name"] [--password "…"]');
    process.exitCode = 1;
    return;
  }
  const given = arg("password");
  if (given !== undefined && given.length < 10) {
    console.error("Use a password of at least 10 characters.");
    process.exitCode = 1;
    return;
  }
  const password = given ?? generatePassword();
  const passwordHash = await hashPassword(password);
  const existing = await db.query.admins.findFirst({ where: eq(admins.email, email) });

  if (existing) {
    await db.update(admins).set({ passwordHash }).where(eq(admins.id, existing.id));
    await db.delete(sessions).where(eq(sessions.adminId, existing.id));
    console.log(`Reset the password for ${email} and signed out its sessions.`);
  } else {
    await db.insert(admins).values({ email, name: arg("name") ?? email.split("@")[0], passwordHash });
    console.log(`Created admin ${email}.`);
  }
  if (given === undefined) console.log(`Password: ${password}\n(Shown once. Change it in Admin → Account.)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => dbClient.close());
