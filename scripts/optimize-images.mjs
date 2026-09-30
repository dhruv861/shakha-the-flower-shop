#!/usr/bin/env node
// Builds responsive AVIF + WebP variants (plus one JPEG fallback) for every
// source photo in media-src/images/ into public/img/, and writes
// src/lib/images.generated.json, which <Picture> reads to emit srcsets.
//
// The site is a static export, so Next's on-demand image optimizer isn't
// available — this does the same job once, ahead of time. Output filenames
// carry a hash of the source, so they can be cached forever (see _headers).
//
// Usage: node scripts/optimize-images.mjs [--force]

import sharp from "sharp";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "media-src", "images");
const outDir = path.join(root, "public", "img");
const manifestPath = path.join(root, "src", "lib", "images.generated.json");
const force = process.argv.includes("--force");

// Widest each photo is ever drawn (CSS px, desktop layout) × 2 for
// high-density screens. The source width caps it further.
const MAX_WIDTH = {
  "hero-pink-roses": 2400,
  "texture-ivory-petals": 2400,
  "storefront-vesu-16x9": 1400,
  "interior-vesu": 1400,
  "viral-litchi-reel": 800,
  "signature-coffee-bouquet": 800,
  "signature-teddy-gift-bag": 800,
};
const DEFAULT_MAX = 640; // occasion tiles, wedding photos
const IG_MAX = 480; // Instagram strip tiles

const LADDER = [240, 360, 480, 560, 640, 800, 960, 1200, 1400, 1600, 1920, 2400];
const FALLBACK_TARGET = 800; // the one JPEG, for browsers without AVIF/WebP

function maxWidthFor(name) {
  if (MAX_WIDTH[name]) return MAX_WIDTH[name];
  return name.startsWith("ig-") ? IG_MAX : DEFAULT_MAX;
}

mkdirSync(outDir, { recursive: true });
const sources = readdirSync(srcDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
if (sources.length === 0) {
  console.error(`No source images found in ${srcDir}`);
  process.exit(1);
}

const manifest = {};
let bytesOut = 0;

for (const file of sources) {
  const name = path.basename(file, path.extname(file));
  const input = readFileSync(path.join(srcDir, file));
  const meta = await sharp(input).metadata();
  const cap = Math.min(maxWidthFor(name), meta.width);
  const widths = [...LADDER.filter((w) => w < cap), cap];
  const fallbackWidth = widths.find((w) => w >= FALLBACK_TARGET) ?? cap;

  const hash = createHash("sha1")
    .update(input)
    .update(JSON.stringify({ widths, v: 1 }))
    .digest("hex")
    .slice(0, 8);
  const base = `${name}.${hash}`;

  // Drop variants left over from an older version of this source.
  for (const old of readdirSync(outDir)) {
    if (old.startsWith(`${name}.`) && !old.startsWith(`${base}-`)) rmSync(path.join(outDir, old));
  }

  const jobs = [];
  for (const w of widths) {
    const resized = () => sharp(input).resize({ width: w, withoutEnlargement: true });
    const targets = [
      [`${base}-${w}.avif`, () => resized().avif({ quality: 52, effort: 5 })],
      [`${base}-${w}.webp`, () => resized().webp({ quality: 78, effort: 5 })],
    ];
    if (w === fallbackWidth) {
      targets.push([`${base}-${w}.jpg`, () => resized().jpeg({ quality: 80, mozjpeg: true, progressive: true })]);
    }
    for (const [out, pipeline] of targets) {
      const outPath = path.join(outDir, out);
      if (!force && existsSync(outPath)) continue;
      jobs.push(pipeline().toFile(outPath).then((info) => (bytesOut += info.size)));
    }
  }
  await Promise.all(jobs);

  manifest[name] = {
    width: meta.width,
    height: meta.height,
    widths,
    base: `/img/${base}`,
    fallback: `/img/${base}-${fallbackWidth}.jpg`,
  };
  console.log(`${name.padEnd(32)} ${widths.join(", ")}${jobs.length ? "" : "  (up to date)"}`);
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nWrote ${Object.keys(manifest).length} images to public/img (${(bytesOut / 1024 / 1024).toFixed(2)} MB new).`);
