// URLs for uploaded product photos. Safe to import from client components.
// A photo's key is either a local storage key, served by
// app/media/[...path]/route.ts, or (with Vercel Blob) the URL prefix of its files.

export type StoredImage = {
  key: string;
  widths: number[];
  width: number;
  height: number;
  alt?: string;
};

/** True for photos kept in Vercel Blob, whose key is already a full URL. */
export function isRemoteKey(key: string) {
  return /^https?:\/\//.test(key);
}

/** The one width that also gets a JPEG, for browsers without AVIF/WebP. */
export function fallbackWidth(widths: number[]) {
  return widths.find((w) => w >= 960) ?? widths[widths.length - 1];
}

export function mediaUrl(key: string, width: number, ext: "avif" | "webp" | "jpg") {
  return `${isRemoteKey(key) ? key : `/media/${key}`}-${width}.${ext}`;
}

export function mediaSrcSet(image: Pick<StoredImage, "key" | "widths">, ext: "avif" | "webp") {
  return image.widths.map((w) => `${mediaUrl(image.key, w, ext)} ${w}w`).join(", ");
}
