import Link from "next/link";
import { occasionStartingPrices, startingPrices } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { ArrowIcon } from "./Icons";
import Picture from "./Picture";
import type { ImageName } from "./Picture";
import styles from "./OccasionsSection.module.css";

type Occasion = {
  name: string;
  detail: string;
  image: ImageName;
  alt: string;
  /** What the tile opens in the shop: an occasion filter or a category. */
  filter: { occasion: string } | { category: string };
};

const OCCASIONS: Occasion[] = [
  {
    name: "Love & romance",
    detail: "Roses, heart boxes and proposals",
    image: "tile-love-heart-box",
    alt: "A heart-shaped box of red roses on an oak table",
    filter: { occasion: "love" },
  },
  {
    name: "Just because",
    detail: "Little bouquets, big smiles",
    image: "tile-just-because-kraft-roses",
    alt: "Pink roses arranged in kraft paper boxes",
    filter: { occasion: "just-because" },
  },
  {
    name: "Hampers & gifting",
    detail: "Fruit, flowers and treats",
    image: "tile-hampers-restaged",
    alt: "Fruit and sunflower gift hampers on an oak table",
    filter: { category: "hampers" },
  },
  {
    name: "Birthdays",
    detail: "Bright, cheerful bouquets",
    image: "tile-birthdays-sunflower",
    alt: "A bouquet of sunflowers and pink lilies",
    filter: { occasion: "birthday" },
  },
];

// Each tile shows the lowest price in the shop for its occasion; a tile with
// nothing orderable yet simply shows no price.
export default async function OccasionsSection() {
  const [byOccasion, byCategory] = await Promise.all([occasionStartingPrices(), startingPrices()]);
  const tiles = OCCASIONS.map(({ filter, ...item }) =>
    "occasion" in filter
      ? { ...item, href: `/shop?occasion=${filter.occasion}`, from: byOccasion[filter.occasion] }
      : { ...item, href: `/shop?category=${filter.category}`, from: byCategory[filter.category] },
  );

  return (
    <section id="occasions" className={styles.section} aria-labelledby="occasions-title">
      <div className="container">
        <div className={styles.head}>
          <div className={`${styles.intro} rise`}>
            <span className="eyebrow">Shop by occasion</span>
            <h2 id="occasions-title" className="display">
              Something for every moment.
            </h2>
          </div>
          <p className={`lead ${styles.headText} rise`} data-d="1">
            <span className={styles.wideOnly}>Birthdays, anniversaries, apologies and “just because”. </span>
            Tell us the occasion and we&apos;ll suggest the flowers.
          </p>
        </div>

        <ul className={styles.grid} role="list">
          {tiles.map((item, i) => (
            <li key={item.name} className="rise" data-d={i} data-dm={i % 2}>
              <Link href={item.href} className={styles.tile}>
                <div className={`${styles.photo} frame`}>
                  <div className={styles.zoom}>
                    <Picture
                      name={item.image}
                      alt={item.alt}
                      sizes="(min-width: 1024px) 282px, (min-width: 768px) 45vw, 44vw"
                    />
                  </div>
                </div>
                <div className={styles.label}>
                  <span className={styles.text}>
                    <span className={styles.name}>{item.name}</span>
                    <span className={styles.detail}>{item.detail}</span>
                    {item.from !== undefined && <span className={styles.from}>From {formatPrice(item.from)}</span>}
                  </span>
                  <span className={styles.arrow} aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
