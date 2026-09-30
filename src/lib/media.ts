// URLs for uploaded product photos, served by app/media/[...path]/route.ts.
// Safe to import from client components.

export type StoredImage = {
  key: string;
  widths: number[];
  width: number;
  height: number;
  alt?: string;
};

/** The one width that also gets a JPEG, for browsers without AVIF/WebP. */
export function fallbackWidth(widths: number[]) {
  return widths.find((w) => w >= 960) ?? widths[widths.length - 1];
}

export function mediaUrl(key: string, width: number, ext: "avif" | "webp" | "jpg") {
  return `/media/${key}-${width}.${ext}`;
}

export function mediaSrcSet(image: Pick<StoredImage, "key" | "widths">, ext: "avif" | "webp") {
  return image.widths.map((w) => `${mediaUrl(image.key, w, ext)} ${w}w`).join(", ");
}
