import "server-only";
import { headers } from "next/headers";

// A small in-memory limiter for login attempts and order spam. It resets when
// the server restarts and isn't shared between instances, which is enough for
// a single shop server; a multi-instance deployment would want a shared store.

const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Counts one attempt; returns false once `limit` is exceeded within the window. */
export function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}
