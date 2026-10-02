import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { databaseConfig, LOCAL_DATABASE } from "../src/db/config";
import { blobOptions } from "../src/lib/image-store";
import { mediaSrcSet, mediaUrl } from "../src/lib/media";

describe("databaseConfig", () => {
  it("uses a local SQLite file when nothing is set", () => {
    assert.deepEqual(databaseConfig({}), { url: LOCAL_DATABASE, source: "default" });
  });

  it("takes DATABASE_URL and its token as set by hand", () => {
    assert.deepEqual(databaseConfig({ DATABASE_URL: "libsql://shop-org.turso.io", DATABASE_AUTH_TOKEN: "t1" }), {
      url: "libsql://shop-org.turso.io",
      authToken: "t1",
      source: "DATABASE_URL",
    });
    assert.equal(databaseConfig({ DATABASE_URL: "file:other.db" }).url, "file:other.db");
  });

  it("reads Vercel's Turso integration, with or without a prefix", () => {
    const plain = databaseConfig({ TURSO_DATABASE_URL: "libsql://a.turso.io", TURSO_AUTH_TOKEN: "ta" });
    assert.deepEqual(plain, { url: "libsql://a.turso.io", authToken: "ta", source: "TURSO_DATABASE_URL" });

    const prefixed = databaseConfig({ SHOP_TURSO_DATABASE_URL: "libsql://b.turso.io", SHOP_TURSO_AUTH_TOKEN: "tb" });
    assert.deepEqual(prefixed, { url: "libsql://b.turso.io", authToken: "tb", source: "SHOP_TURSO_DATABASE_URL" });
  });

  it("pairs each URL with its own token", () => {
    const config = databaseConfig({
      SHOP_TURSO_DATABASE_URL: "libsql://b.turso.io",
      SHOP_TURSO_AUTH_TOKEN: "tb",
      OTHER_AUTH_TOKEN: "wrong",
    });
    assert.equal(config.authToken, "tb");
  });

  it("finds a libsql:// URL under any name, with the token beside it", () => {
    const config = databaseConfig({ STORAGE_URL: "libsql://c.turso.io", STORAGE_AUTH_TOKEN: "tc", SITE_URL: "https://example.com" });
    assert.deepEqual(config, { url: "libsql://c.turso.io", authToken: "tc", source: "STORAGE_URL" });
  });

  it("skips a Postgres DATABASE_URL when Turso is connected", () => {
    const config = databaseConfig({ DATABASE_URL: "postgres://x", TURSO_DATABASE_URL: "libsql://a.turso.io" });
    assert.equal(config.url, "libsql://a.turso.io");
  });

  it("refuses a DATABASE_URL it can't use", () => {
    assert.throws(() => databaseConfig({ DATABASE_URL: "postgres://x" }), /must be a Turso\/libSQL URL/);
  });
});

describe("blobOptions", () => {
  it("is off without a Blob store", () => {
    assert.equal(blobOptions({}), null);
    assert.equal(blobOptions({ BLOB_STORE_ID: "store" }), null); // OIDC needs Vercel's token too
  });

  it("uses the read-write token, prefixed or not", () => {
    assert.deepEqual(blobOptions({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_abc" }), { token: "vercel_blob_rw_abc" });
    assert.deepEqual(blobOptions({ PHOTOS_READ_WRITE_TOKEN: "vercel_blob_rw_def" }), { token: "vercel_blob_rw_def" });
    assert.equal(blobOptions({ OTHER_READ_WRITE_TOKEN: "not-a-blob-token" }), null);
  });

  it("lets the SDK sign in with Vercel's OIDC token", () => {
    assert.deepEqual(blobOptions({ BLOB_STORE_ID: "store", VERCEL_OIDC_TOKEN: "oidc" }), {});
  });
});

describe("mediaUrl", () => {
  it("serves local photos through /media", () => {
    assert.equal(mediaUrl("abc-12ef", 720, "webp"), "/media/abc-12ef-720.webp");
  });

  it("uses Blob photos' own URLs", () => {
    const key = "https://store.public.blob.vercel-storage.com/products/abc-12ef";
    assert.equal(mediaUrl(key, 360, "avif"), `${key}-360.avif`);
    assert.equal(mediaSrcSet({ key, widths: [360, 720] }, "webp"), `${key}-360.webp 360w, ${key}-720.webp 720w`);
  });
});
