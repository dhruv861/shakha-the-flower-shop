#!/usr/bin/env node
// Generates the favicon set and the social share image from the brand fonts
// (media-src/fonts, OFL) and the hero photo. Text is converted to outlines
// with opentype.js, so nothing depends on fonts installed on this machine.
//
// Writes into src/app/ (Next's metadata file conventions):
//   icon.svg, favicon.ico, apple-icon.png, opengraph-image.jpg, twitter-image.jpg
//
// Usage: node scripts/make-brand-assets.mjs

import opentype from "opentype.js";
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontDir = path.join(root, "media-src", "fonts");
const appDir = path.join(root, "src", "app");

const font = (file) => opentype.loadSync(path.join(fontDir, file));
const serifBold = font("Fraunces-SemiBold-144.ttf");
const serif = font("Fraunces-Regular-144.ttf");
const serifItalic = font("Fraunces-Italic-144.ttf");
const sans = font("InstrumentSans-SemiBold.ttf");

const FOREST = "#1C2F25";
const CREAM = "#F7F1E8";
const INK = "#1D2A22";
const MUTED = "#57605A";
const ROSE = "#9C3F52";

/** Lays out `text` on one line with kerning and extra tracking (em). */
function textPath(f, text, x, y, size, tracking = 0) {
  const scale = size / f.unitsPerEm;
  const glyphs = f.stringToGlyphs(text);
  let cursor = x;
  let d = "";
  glyphs.forEach((glyph, i) => {
    d += glyph.getPath(cursor, y, size).toPathData(2);
    cursor += glyph.advanceWidth * scale;
    if (i < glyphs.length - 1) {
      cursor += f.getKerningValue(glyph, glyphs[i + 1]) * scale + tracking * size;
    }
  });
  return { d, width: cursor - x };
}

// ---- Icon: a serif "S" on forest green ------------------------------------

function iconSvg(size, radius) {
  const letterSize = size * 0.8;
  const box = serifBold.getPath("S", 0, 0, letterSize).getBoundingBox();
  const x = (size - (box.x2 - box.x1)) / 2 - box.x1;
  const y = (size - (box.y2 - box.y1)) / 2 - box.y1;
  const { d } = textPath(serifBold, "S", x, y, letterSize);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${FOREST}"/><path d="${d}" fill="${CREAM}"/></svg>`;
}

const roundedIcon = iconSvg(512, 112);
writeFileSync(path.join(appDir, "icon.svg"), roundedIcon);

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

// iOS masks its own corners, so the touch icon is a full square.
await sharp(await png(iconSvg(512, 0), 180)).toFile(path.join(appDir, "apple-icon.png"));

// favicon.ico: PNG-compressed entries, which every current browser reads.
const entries = await Promise.all([16, 32, 48].map(async (s) => ({ s, buf: await png(roundedIcon, s) })));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(entries.length, 4);
let offset = 6 + 16 * entries.length;
const dir = entries.map(({ s, buf }) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(s, 0);
  e.writeUInt8(s, 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(buf.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += buf.length;
  return e;
});
writeFileSync(path.join(appDir, "favicon.ico"), Buffer.concat([header, ...dir, ...entries.map((e) => e.buf)]));

// ---- Share image: hero photo with the wordmark on the ivory wall ----------

const W = 1200;
const H = 630;
const left = 76;

const wordmark = textPath(serifBold, "SHAKHA", left, 132, 58, 0.16);
const sub = textPath(sans, "THE FLOWER SHOP", left + 2, 170, 15, 0.34);
const eyebrow = textPath(sans, "SURAT · SINCE 2014", left + 2, 394, 15, 0.26);
const line1 = textPath(serif, "Not just flowers.", left, 452, 46);
const line2 = textPath(serifItalic, "Emotions, wrapped", left, 508, 46);
const line3 = textPath(serifItalic, "beautifully.", left, 564, 46);

const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<path d="${wordmark.d}" fill="${INK}"/>
<path d="${sub.d}" fill="${MUTED}"/>
<path d="${eyebrow.d}" fill="${ROSE}"/>
<path d="${line1.d}" fill="${INK}"/>
<path d="${line2.d}" fill="${ROSE}"/>
<path d="${line3.d}" fill="${ROSE}"/>
</svg>`;

const og = await sharp(path.join(root, "media-src", "images", "hero-pink-roses.jpg"))
  .resize(W, H, { fit: "cover", position: "right" })
  .composite([{ input: Buffer.from(overlay) }])
  .jpeg({ quality: 84, mozjpeg: true })
  .toBuffer();

const alt =
  "Shakha The Flower Shop, Surat: a hand-tied bouquet of pink roses beside the words “Not just flowers. Emotions, wrapped beautifully.”";
for (const name of ["opengraph-image", "twitter-image"]) {
  writeFileSync(path.join(appDir, `${name}.jpg`), og);
  writeFileSync(path.join(appDir, `${name}.alt.txt`), alt);
}

console.log("Wrote icon.svg, favicon.ico, apple-icon.png, opengraph-image.jpg, twitter-image.jpg to src/app/");
