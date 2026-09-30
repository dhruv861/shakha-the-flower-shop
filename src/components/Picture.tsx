import images from "@/lib/images.generated.json";

export type ImageName = keyof typeof images;

type PictureProps = {
  name: ImageName;
  alt: string;
  /** The rendered width at each breakpoint, so the browser picks the right file. */
  sizes: string;
  /** The hero: load immediately at high priority instead of lazily. */
  priority?: boolean;
  className?: string;
};

/**
 * A responsive photo from the pre-built set in public/img
 * (scripts/optimize-images.mjs): AVIF, then WebP, then one JPEG fallback.
 * width/height carry the intrinsic ratio so nothing shifts while it loads.
 */
export default function Picture({ name, alt, sizes, priority = false, className }: PictureProps) {
  const image = images[name];
  const srcSet = (ext: string) => image.widths.map((w) => `${image.base}-${w}.${ext} ${w}w`).join(", ");

  return (
    <picture>
      <source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet("webp")} sizes={sizes} />
      <img
        src={image.fallback}
        alt={alt}
        width={image.width}
        height={image.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? undefined : "async"}
        fetchPriority={priority ? "high" : undefined}
        className={className}
      />
    </picture>
  );
}
