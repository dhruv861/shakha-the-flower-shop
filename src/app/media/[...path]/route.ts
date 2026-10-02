import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/image-store";

// Serves uploaded product photos from UPLOAD_DIR. Next only serves public/
// files that existed at build time, so uploads need their own route.
// Names are content-unique (key + width), so they can be cached forever.

const TYPES = { avif: "image/avif", webp: "image/webp", jpg: "image/jpeg" } as const;
const NAME = /^([a-z0-9]+-[a-f0-9]+)-(\d{2,4})\.(avif|webp|jpg)$/;

export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const name = parts.join("/");
  const match = NAME.exec(name);
  if (!match) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[match[3] as keyof typeof TYPES],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
