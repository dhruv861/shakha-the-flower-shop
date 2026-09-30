import Link from "next/link";
import type { ShopCard } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import ProductImage from "./ProductImage";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product, priority = false }: { product: ShopCard; priority?: boolean }) {
  return (
    <Link href={`/shop/${product.slug}`} className={styles.card}>
      <span className={styles.photo}>
        <span className={styles.zoom}>
          <ProductImage
            image={product.image}
            alt={product.image?.alt || product.name}
            sizes="(min-width: 1200px) 280px, (min-width: 768px) 30vw, 46vw"
            priority={priority}
          />
        </span>
        {!product.inStock && <span className={styles.badge}>Sold out today</span>}
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{product.name}</span>
        <span className={styles.summary}>{product.summary}</span>
        <span className={styles.price}>
          {product.variantCount > 1 ? "From " : ""}
          {formatPrice(product.minPrice)}
        </span>
      </span>
    </Link>
  );
}
