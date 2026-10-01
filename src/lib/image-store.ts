import { randomBytes } from "node:crypto";
import { mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { fallbackWidth } from "./media";

// Uploaded photos are re-encoded on arrival: rotated upright, capped in size,
// stripped of EXIF (no phone GPS data leaks) and saved as AVIF + WebP in a few
// widths, plus one JPEG. Files live on disk in UPLOAD_DIR, so production needs
// a persistent disk (or a swap to object storage).

// Runtime data: the ignore hint keeps the build from tracing the project into its output.
export const UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "data/uploads");

const LADDER = [360, 720, 1080, 1440];
const MAX_BYTES = 15 * 1024 * 1024;

export class ImageError extends Error {}

export async function storeImage(input: Buffer) {
  if (input.byteLength > MAX_BYTES) throw new ImageError("That photo is over 15 MB. Try a smaller one.");

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
  await mkdir(UPLOAD_DIR, { recursive: true });

  await Promise.all(
    widths.flatMap((w) => {
      const resized = () => sharp(base.data).resize({ width: w });
      const file = (ext: string) => path.join(UPLOAD_DIR, `${key}-${w}.${ext}`);
      const jobs = [
        resized().avif({ quality: 52, effort: 4 }).toFile(file("avif")),
        resized().webp({ quality: 78 }).toFile(file("webp")),
      ];
      if (w === jpgWidth) jobs.push(resized().jpeg({ quality: 80, mozjpeg: true }).toFile(file("jpg")));
      return jobs;
    }),
  );

  return { key, widths, width, height };
}

export async function deleteImageFiles(key: string) {
  const files = await readdir(UPLOAD_DIR).catch(() => [] as string[]);
  await Promise.all(
    files.filter((f) => f.startsWith(`${key}-`)).map((f) => unlink(path.join(UPLOAD_DIR, f)).catch(() => {})),
  );
}
