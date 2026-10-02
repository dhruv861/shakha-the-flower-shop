import { DATABASE_URL } from "../src/db/client";
import { blobOptions } from "../src/lib/image-store";

/**
 * Filling a hosted database from this computer must put the photos where the
 * hosted site can reach them (Vercel Blob), not on this computer's disk.
 * Pass --local-photos when running on the server that keeps the photos itself.
 */
export function photosReachable() {
  if (DATABASE_URL.startsWith("file:") || blobOptions() || process.argv.includes("--local-photos")) return true;
  console.error(
    "The database is hosted, but no Vercel Blob store is set up, so the photos would only be saved on this computer.\n" +
      "Connect a Blob store and pull its BLOB_READ_WRITE_TOKEN (see README → Deploying), " +
      "or add --local-photos if this machine serves the photos itself.",
  );
  process.exitCode = 1;
  return false;
}
