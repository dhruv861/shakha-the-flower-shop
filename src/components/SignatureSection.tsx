import Link from "next/link";
import { cardsBySlug } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { PLACEHOLDER, whatsappLink } from "@/lib/site";
import { ArrowIcon, PlayIcon } from "./Icons";
import Picture from "./Picture";
import type { ImageName } from "./Picture";
import styles from "./SignatureSection.module.css";

type Creation = {
  name: string;
  slug: string;
  image: ImageName;
  alt: string;
  description: string;
  viral?: boolean;
};

const CREATIONS: Creation[] = [
  {
    name: "The Litchi Bouquet",
    slug: "the-litchi-bouquet",
    image: "viral-litchi-reel",
    alt: "The Litchi Bouquet: fresh litchis nestled in baby's breath, from Shakha's most-viewed Instagram reel",
    description: "Fresh litchis nestled in baby's breath — the bouquet that went viral.",
    viral: true,
  },
  {
    name: "The Coffee Bouquet",
    slug: "the-coffee-bouquet",
    image: "signature-coffee-bouquet",
    alt: "The Coffee Bouquet: Davidoff coffee jars arranged with fresh flowers",
    description: "Davidoff coffee and fresh florals, wrapped to gift — for the coffee lover.",
  },
  {
    name: "Teddy Gift Bag",
    slug: "teddy-gift-bag",
    image: "signature-teddy-gift-bag",
    alt: "A pink teddy with fresh pink blooms in a clear gift bag",
    description: "A plush teddy with fresh pink blooms in a clear gift bag.",
  },
];

const ALSO_ON_THE_MENU = [
  { name: "Jamun", slug: "jamun-bouquet" },
  { name: "Mocktail", slug: "mocktail-bouquet" },
  { name: "Diet Coke", slug: "diet-coke-bouquet" },
  { name: "Ferrero", slug: "ferrero-bouquet" },
  { name: "Laddu", slug: "laddu-bouquet" },
];

// Cards link to the shop once Shakha publishes a product with a price;
// until then they open WhatsApp, as before the shop existed.
export default async function SignatureSection() {
  const live = await cardsBySlug([...CREATIONS, ...ALSO_ON_THE_MENU].map((c) => c.slug));
  return (
    <section id="signature" className={`${styles.section} on-dark`} aria-labelledby="signature-title">
      <div className={`container ${styles.head}`}>
        <div className={`${styles.intro} rise`}>
          <span className="eyebrow">Signature creations</span>
          <h2 id="signature-title" className={`display ${styles.title}`}>
            Bouquets people <em>stop scrolling</em> for.
          </h2>
        </div>
        <div className={`${styles.aside} rise`} data-d="1">
          <p className="lead">
            Fruit, coffee, chocolate and teddy bouquets — our most-shared creations, made fresh to order.
          </p>
          <a
            href={whatsappLink("Hi Shakha! I'd like a custom creation.")}
            target="_blank"
            rel="noopener noreferrer"
            className={`link-arrow ${styles.custom}`}
          >
            Ask for a custom creation
            <ArrowIcon />
          </a>
        </div>
      </div>

      <ul className={`${styles.rail} rise-sm`} role="list">
        {CREATIONS.map((item, i) => {
          const card = live[item.slug];
          return (
          <li key={item.name} className={`${styles.card} ${item.viral ? styles.viral : ""} rise`} data-d={i}>
            <div className={`${styles.photo} frame`}>
              <div className={styles.zoom}>
                <Picture
                  name={item.image}
                  alt={item.alt}
                  sizes="(min-width: 1024px) 380px, (min-width: 768px) 320px, 68vw"
                />
              </div>
              {item.viral && (
                <span className={styles.badge}>
                  <PlayIcon />
                  <span>
                    2.3M+ views<span className={styles.badgeMore}> on Instagram</span>
                  </span>
                </span>
              )}
            </div>
            <div className={styles.body}>
              <div className={styles.nameRow}>
                <h3 className={styles.name}>
                  {card ? (
                    <Link href={`/shop/${item.slug}`} className={styles.cardLink}>
                      {item.name}
                    </Link>
                  ) : (
                    <a
                      href={whatsappLink(`Hi Shakha! I'd like to order ${item.name}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.cardLink}
                    >
                      {item.name}
                    </a>
                  )}
                </h3>
                <span className={styles.price}>
                  {card
                    ? `${card.variantCount > 1 ? "From " : ""}${formatPrice(card.minPrice)}`
                    : `From ₹${PLACEHOLDER.price}`}
                </span>
              </div>
              <p className={styles.text}>{item.description}</p>
            </div>
          </li>
          );
        })}
      </ul>

      <div className={`container ${styles.also}`}>
        <p className={styles.alsoLine}>
          Also on the menu: jamun, mocktail, Diet Coke, Ferrero and laddu bouquets.
        </p>
        <div className={`${styles.chips} rise`}>
          <span className={styles.chipsLabel}>Also on the menu</span>
          <ul className={styles.chipList} role="list">
            {ALSO_ON_THE_MENU.map((item) => (
              <li key={item.slug}>
                {live[item.slug] ? (
                  <Link href={`/shop/${item.slug}`} className={`chip ${styles.chipLink}`}>
                    {item.name} bouquet
                  </Link>
                ) : (
                  <span className="chip">{item.name} bouquet</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
