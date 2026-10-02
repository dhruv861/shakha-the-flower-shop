import { randomBytes } from "node:crypto";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobError, del, list, put } from "@vercel/blob";
import sharp from "sharp";
import { fallbackWidth, isRemoteKey } from "./media";

// Uploaded photos are re-encoded on arrival: rotated upright, capped in size,
// stripped of EXIF (no phone GPS data leaks) and saved as AVIF + WebP in a few
// widths, plus one JPEG. They're kept in Vercel Blob when a Blob store is
// connected (hosted deployments), otherwise on disk in UPLOAD_DIR.

// Runtime data: the ignore hint keeps the build from tracing the project into its output.
export const UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "data/uploads");

const LADDER = [360, 720, 1080, 1440];
const MAX_BYTES = 15 * 1024 * 1024;
const BLOB_FOLDER = "products";
const ONE_YEAR = 365 * 24 * 60 * 60;

export class ImageError extends Error {}

type Env = Record<string, string | undefined>;

/**
 * Vercel Blob credentials when a Blob store is connected, or null for local disk.
 * Reads BLOB_READ_WRITE_TOKEN, a prefixed copy of it (<PREFIX>_READ_WRITE_TOKEN),
 * or newer stores' BLOB_STORE_ID with Vercel's OIDC token (which the SDK picks up).
 */
export function blobOptions(env: Env = process.env): { token?: string } | null {
  if (env.BLOB_READ_WRITE_TOKEN) return { token: env.BLOB_READ_WRITE_TOKEN };
  const prefixed = Object.keys(env)
    .filter((k) => k.endsWith("_READ_WRITE_TOKEN"))
    .sort()
    .find((k) => env[k]?.startsWith("vercel_blob_rw_"));
  if (prefixed) return { token: env[prefixed] };
  if (env.BLOB_STORE_ID && env.VERCEL_OIDC_TOKEN) return {};
  return null;
}

export async function storeImage(input: Buffer) {
  if (input.byteLength > MAX_BYTES) throw new ImageError("That photo is over 15 MB. Try a smaller one.");
  const blob = blobOptions();
  if (!blob && process.env.VERCEL) {
    throw new ImageError("Photos need a Vercel Blob store here. Add one in the project's Storage tab, then redeploy.");
  }

  let base: { data: Buffer; info: { width: number; height: number } };
  try {
    base = await sharp(input, { limitInputPixels: 60_000_000 })
      .rotate()
      .resize({ width: 1440, height: 1800, fit: "inside", withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new ImageError("We couldn't read that file. Upload a JPG, PNG or WebP photo.");
  }

  const { width, height } = base.info;
  const widths = [...new Set([...LADDER.filter((w) => w < width), Math.min(width, 1440)])];
  const key = `${Date.now().toString(36)}-${randomBytes(5).toString("hex")}`;
  const jpgWidth = fallbackWidth(widths);

  const files = await Promise.all(
    widths.flatMap((w) => {
      const resized = () => sharp(base.data).resize({ width: w });
      const file = (ext: string, type: string, data: Promise<Buffer>) => data.then((buffer) => ({ name: `${key}-${w}.${ext}`, type, buffer }));
      const jobs = [
        file("avif", "image/avif", resized().avif({ quality: 52, effort: 4 }).toBuffer()),
        file("webp", "image/webp", resized().webp({ quality: 78 }).toBuffer()),
      ];
      if (w === jpgWidth) jobs.push(file("jpg", "image/jpeg", resized().jpeg({ quality: 80, mozjpeg: true }).toBuffer()));
      return jobs;
    }),
  );

  if (blob) {
    let urls: string[];
    try {
      const uploaded = await Promise.all(
        files.map((f) =>
          put(`${BLOB_FOLDER}/${f.name}`, f.buffer, {
            access: "public",
            contentType: f.type,
            // Every file name is unique, so browsers and the CDN can keep them for good.
            cacheControlMaxAge: ONE_YEAR,
            ...blob,
          }),
        ),
      );
      urls = uploaded.map((u) => u.url);
    } catch (error) {
      if (error instanceof BlobError) throw new ImageError(`Vercel Blob refused the photo: ${error.message}`);
      throw error;
    }
    // The key becomes the files' shared URL prefix, so pages build each size's address directly.
    return { key: urls[0].slice(0, urls[0].lastIndexOf("/") + 1) + key, widths, width, height };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await Promise.all(files.map((f) => writeFile(path.join(UPLOAD_DIR, f.name), f.buffer)));
  return { key, widths, width, height };
}

/** Deletes a photo's files. Failures are logged, not thrown: the database row is what matters. */
export async function deleteImageFiles(key: string) {
  if (isRemoteKey(key)) {
    const blob = blobOptions();
    if (!blob) return;
    try {
      const { blobs } = await list({ prefix: `${new URL(key).pathname.slice(1)}-`, ...blob });
      if (blobs.length) await del(blobs.map((b) => b.url), blob);
    } catch (error) {
      console.error("Couldn't delete photo files from Vercel Blob", key, error);
    }
    return;
  }
  const files = await readdir(UPLOAD_DIR).catch(() => [] as string[]);
  await Promise.all(
    files.filter((f) => f.startsWith(`${key}-`)).map((f) => unlink(path.join(UPLOAD_DIR, f)).catch(() => {})),
  );
}
