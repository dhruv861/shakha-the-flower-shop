import { whatsappLink } from "@/lib/site";
import { ArrowIcon } from "./Icons";
import Picture from "./Picture";
import type { ImageName } from "./Picture";
import styles from "./OccasionsSection.module.css";

type Occasion = {
  name: string;
  detail: string;
  image: ImageName;
  alt: string;
  message: string;
};

// There are no category pages: each tile opens WhatsApp with the occasion
// already typed, which is how Shakha takes orders.
const OCCASIONS: Occasion[] = [
  {
    name: "Love & romance",
    detail: "Roses, heart boxes and proposals",
    image: "tile-love-heart-box",
    alt: "A heart-shaped box of red roses on an oak table",
    message: "Hi Shakha! I'm looking for something romantic.",
  },
  {
    name: "Just because",
    detail: "Little bouquets, big smiles",
    image: "tile-just-because-kraft-roses",
    alt: "Pink roses arranged in kraft paper boxes",
    message: "Hi Shakha! I'd like a little bouquet, just because.",
  },
  {
    name: "Hampers & gifting",
    detail: "Fruit, flowers and treats",
    image: "tile-hampers-restaged",
    alt: "Fruit and sunflower gift hampers on an oak table",
    message: "Hi Shakha! I'm looking for a gift hamper.",
  },
  {
    name: "Birthdays",
    detail: "Bright, cheerful bouquets",
    image: "tile-birthdays-sunflower",
    alt: "A bouquet of sunflowers and pink lilies",
    message: "Hi Shakha! I'm looking for birthday flowers.",
  },
];

export default function OccasionsSection() {
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
          {OCCASIONS.map((item, i) => (
            <li key={item.name} className="rise" data-d={i} data-dm={i % 2}>
              <a href={whatsappLink(item.message)} target="_blank" rel="noopener noreferrer" className={styles.tile}>
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
                  </span>
                  <span className={styles.arrow} aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
