import { fallbackWidth, mediaSrcSet, mediaUrl, type StoredImage } from "@/lib/media";
import styles from "./ProductImage.module.css";

type Props = {
  image: StoredImage | null;
  sizes: string;
  alt?: string;
  priority?: boolean;
  className?: string;
};

/** An uploaded product photo (AVIF, then WebP, then JPEG), or a soft placeholder. */
export default function ProductImage({ image, sizes, alt, priority = false, className }: Props) {
  if (!image) {
    return (
      <span className={`${styles.placeholder} ${className ?? ""}`} role="img" aria-label={alt ?? "Photo coming soon"}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M12 21v-8" />
          <path d="M12 13c0-4.2 3.1-7 7-7 0 4.2-3.1 7-7 7z" />
          <path d="M12 15c0-3.6-2.6-6-6-6 0 3.6 2.6 6 6 6z" />
        </svg>
      </span>
    );
  }
  return (
    <picture>
      <source type="image/avif" srcSet={mediaSrcSet(image, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={mediaSrcSet(image, "webp")} sizes={sizes} />
      <img
        src={mediaUrl(image.key, fallbackWidth(image.widths), "jpg")}
        alt={alt ?? image.alt ?? ""}
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
