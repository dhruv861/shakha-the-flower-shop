// Fills an empty database with Shakha's categories and products, using the
// photos from media-src/images. Every product starts as an unpriced draft:
// prices are Shakha's to set in the admin panel, never guessed here.
//
// Usage: npm run db:seed   (does nothing if products already exist)

import { readFile } from "node:fs/promises";
import path from "node:path";
import { categories, productImages, products, productVariants } from "../src/db/schema";
import { db, dbClient } from "../src/db/client";
import { storeImage } from "../src/lib/image-store";

const CATEGORIES = [
  {
    slug: "signature",
    name: "Signature creations",
    description: "Fruit, coffee, chocolate and teddy bouquets — our most-shared creations, made fresh to order.",
  },
  { slug: "bouquets", name: "Bouquets", description: "Hand-tied bouquets and flower boxes, made to order." },
  { slug: "hampers", name: "Hampers & gifting", description: "Fruit, flowers and treats, arranged to gift." },
  { slug: "add-ons", name: "Add-ons", description: "Add a teddy or chocolates to make it a gift." },
];

type SeedProduct = {
  name: string;
  slug: string;
  category: string;
  summary: string;
  occasions: string[];
  image?: string;
  alt?: string;
  featured?: boolean;
  isAddon?: boolean;
};

const PRODUCTS: SeedProduct[] = [
  {
    name: "The Litchi Bouquet",
    slug: "the-litchi-bouquet",
    category: "signature",
    summary: "Fresh litchis nestled in baby's breath — the bouquet that went viral.",
    occasions: ["birthday", "just-because"],
    image: "viral-litchi-reel",
    alt: "The Litchi Bouquet: fresh litchis nestled in baby's breath",
    featured: true,
  },
  {
    name: "The Coffee Bouquet",
    slug: "the-coffee-bouquet",
    category: "signature",
    summary: "Davidoff coffee and fresh florals, wrapped to gift — for the coffee lover.",
    occasions: ["birthday", "just-because"],
    image: "signature-coffee-bouquet",
    alt: "The Coffee Bouquet: Davidoff coffee jars arranged with fresh flowers",
    featured: true,
  },
  {
    name: "Teddy Gift Bag",
    slug: "teddy-gift-bag",
    category: "signature",
    summary: "A plush teddy with fresh pink blooms in a clear gift bag.",
    occasions: ["love", "birthday"],
    image: "signature-teddy-gift-bag",
    alt: "A pink teddy with fresh pink blooms in a clear gift bag",
    featured: true,
  },
  {
    name: "Jamun Bouquet",
    slug: "jamun-bouquet",
    category: "signature",
    summary: "Fresh jamuns, wrapped as a bouquet. When flowers are common, gift something unforgettable.",
    occasions: ["just-because"],
    image: "ig-jamun",
    alt: "The Jamun Bouquet",
  },
  {
    name: "Mocktail Bouquet",
    slug: "mocktail-bouquet",
    category: "signature",
    summary: "A bouquet built around mocktails — the one they'll remember.",
    occasions: ["birthday", "just-because"],
    image: "ig-mocktail",
    alt: "The Mocktail Bouquet",
  },
  {
    name: "Ferrero Bouquet",
    slug: "ferrero-bouquet",
    category: "signature",
    summary: "Ferrero Rocher chocolates and fresh blooms, wrapped with a teddy.",
    occasions: ["love", "birthday"],
    image: "ig-ferrero-teddy",
    alt: "Ferrero Rocher chocolates and flowers wrapped with a teddy",
  },
  {
    name: "Laddu Bouquet",
    slug: "laddu-bouquet",
    category: "signature",
    summary: "Laddus wrapped with flowers, for Ganesh Chaturthi and festive gifting.",
    occasions: [],
    image: "ig-laddu",
    alt: "The Laddu Bouquet for Ganesh Chaturthi",
  },
  {
    name: "Diet Coke Bouquet",
    slug: "diet-coke-bouquet",
    category: "signature",
    summary: "Diet Coke, wrapped as a bouquet.",
    occasions: ["birthday", "just-because"],
  },
  {
    name: "Pink Rose Bouquet",
    slug: "pink-rose-bouquet",
    category: "bouquets",
    summary: "Pink roses and baby's breath, hand-tied in blush and peach wrapping.",
    occasions: ["love", "anniversary", "birthday"],
    image: "hero-pink-roses",
    alt: "A hand-tied bouquet of pink roses and baby's breath in blush and peach wrapping",
  },
  {
    name: "Heart Box of Red Roses",
    slug: "heart-box-of-red-roses",
    category: "bouquets",
    summary: "Red roses arranged in a heart-shaped box.",
    occasions: ["love", "anniversary", "sorry"],
    image: "tile-love-heart-box",
    alt: "A heart-shaped box of red roses on an oak table",
  },
  {
    name: "Kraft Rose Boxes",
    slug: "kraft-rose-boxes",
    category: "bouquets",
    summary: "Pink roses arranged in kraft paper boxes.",
    occasions: ["just-because", "birthday"],
    image: "tile-just-because-kraft-roses",
    alt: "Pink roses arranged in kraft paper boxes",
  },
  {
    name: "Sunflower & Lily Bouquet",
    slug: "sunflower-and-lily-bouquet",
    category: "bouquets",
    summary: "Sunflowers and pink lilies — bright and cheerful.",
    occasions: ["birthday", "just-because"],
    image: "tile-birthdays-sunflower",
    alt: "A bouquet of sunflowers and pink lilies",
  },
  {
    name: "Orchid Bouquet",
    slug: "orchid-bouquet",
    category: "bouquets",
    summary: "Purple orchids, wrapped to gift. Not everybody deserves orchids, but you do.",
    occasions: ["love", "anniversary"],
    image: "ig-orchid",
    alt: "A bouquet of purple orchids",
  },
  {
    name: "White & Yellow Bouquet",
    slug: "white-and-yellow-bouquet",
    category: "bouquets",
    summary: "White and yellow blooms in a soft, fresh bouquet.",
    occasions: ["just-because", "sorry"],
    image: "ig-white-bouquet",
    alt: "A bouquet of white and yellow flowers",
  },
  {
    name: "Fruit & Sunflower Hamper",
    slug: "fruit-and-sunflower-hamper",
    category: "hampers",
    summary: "Fruit and sunflowers, arranged in a gift hamper.",
    occasions: ["birthday", "just-because"],
    image: "tile-hampers-restaged",
    alt: "Fruit and sunflower gift hampers on an oak table",
  },
  {
    name: "Teddy bear",
    slug: "teddy-bear",
    category: "add-ons",
    summary: "A soft teddy to go with your flowers.",
    occasions: [],
    isAddon: true,
  },
  {
    name: "Chocolates",
    slug: "chocolates",
    category: "add-ons",
    summary: "Chocolates to go with your flowers.",
    occasions: [],
    isAddon: true,
  },
];

async function main() {
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length) {
    console.log("Products already exist; nothing to seed.");
    return;
  }

  const categoryIds = new Map<string, number>();
  for (const [i, c] of CATEGORIES.entries()) {
    const [row] = await db
      .insert(categories)
      .values({ ...c, sortOrder: i })
      .onConflictDoUpdate({ target: categories.slug, set: { name: c.name } })
      .returning({ id: categories.id });
    categoryIds.set(c.slug, row.id);
  }

  for (const [i, p] of PRODUCTS.entries()) {
    const [row] = await db
      .insert(products)
      .values({
        name: p.name,
        slug: p.slug,
        categoryId: categoryIds.get(p.category) ?? null,
        summary: p.summary,
        occasions: p.occasions,
        status: "draft",
        featured: p.featured ?? false,
        isAddon: p.isAddon ?? false,
        sortOrder: i,
      })
      .returning({ id: products.id });
    await db.insert(productVariants).values({ productId: row.id, name: "Standard", price: null });
    if (p.image) {
      const buffer = await readFile(path.join("media-src", "images", `${p.image}.jpg`));
      const stored = await storeImage(buffer);
      await db.insert(productImages).values({ productId: row.id, ...stored, alt: p.alt ?? p.name });
    }
    process.stdout.write(`  ${p.name}${p.image ? "" : " (no photo yet)"}\n`);
  }
  console.log(`Seeded ${CATEGORIES.length} categories and ${PRODUCTS.length} draft products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => dbClient.close());
