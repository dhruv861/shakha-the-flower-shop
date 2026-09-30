"use client";

import { useState } from "react";
import type { StoredImage } from "@/lib/media";
import ProductImage from "./ProductImage";
import styles from "./ProductGallery.module.css";

export default function ProductGallery({ images, name }: { images: StoredImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        <ProductImage
          image={current}
          alt={current?.alt || name}
          sizes="(min-width: 1024px) 560px, 100vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className={styles.thumbs} role="group" aria-label="Photos">
          {images.map((image, i) => (
            <button
              key={image.key}
              type="button"
              className={styles.thumb}
              aria-pressed={i === active}
              aria-label={`Photo ${i + 1} of ${images.length}`}
              onClick={() => setActive(i)}
            >
              <ProductImage image={image} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
