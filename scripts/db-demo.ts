// Turns a freshly seeded database into a demo shop, for showing how ordering
// and the admin work:
//   • adds Shakha's own photos to the products that had none, a second photo
//     to a few, and four more products from Shakha's posts (photos in
//     media-src/products; sources.json says which post each one comes from),
//   • gives every product a SAMPLE price and puts it live,
//   • adds a few SAMPLE orders at different stages.
// Shakha has never published prices, so every price here is made up for the
// demo, and so are the orders. Set real prices in Admin → Products before
// taking real orders.
//
// Usage: npm run setup && npm run db:demo
// It refuses a database that already has orders or live products.

import "./load-env";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { asc, eq, sql } from "drizzle-orm";
import {
  categories,
  orderItems,
  orders,
  type OrderStatus,
  type PaymentStatus,
  productImages,
  products,
  productVariants,
} from "../src/db/schema";
import { db, dbClient } from "../src/db/client";
import { addDays, indiaNow, slotLabel } from "../src/lib/delivery";
import { storeImage } from "../src/lib/image-store";
import { site } from "../src/lib/site";

type Size = [name: string, price: number];

// SAMPLE prices in rupees, for the demo only. One size unless several are listed.
const PRICES: Record<string, number | Size[]> = {
  "the-litchi-bouquet": 1999,
  "the-coffee-bouquet": 2499,
  "ferrero-bouquet": 2999,
  "teddy-bouquet": 2799,
  "chocolate-bouquet": 1499,
  "mocktail-bouquet": 2299,
  "diet-coke-bouquet": 1599,
  "teddy-gift-bag": 1499,
  "jamun-bouquet": 1799,
  "laddu-bouquet": 1299,
  "pink-rose-bouquet": [
    ["Classic", 1299],
    ["Deluxe", 1999],
    ["Grand", 2999],
  ],
  "pink-lily-bouquet": 1899,
  "heart-box-of-red-roses": 2499,
  "orchid-bouquet": [
    ["Classic", 1999],
    ["Deluxe", 2999],
  ],
  "sunflower-and-lily-bouquet": 1699,
  "kraft-bag-flower-basket": 1499,
  "kraft-rose-boxes": 999,
  "white-and-yellow-bouquet": 1199,
  "fruit-and-sunflower-hamper": 2499,
  "mini-teddy": 399,
  "ferrero-rocher-box": 599,
};

// Shop order: the keys of PRICES, top to bottom.
const DISPLAY_ORDER = Object.keys(PRICES);

// Seasonal, so it shows the "Sold out today" state.
const SOLD_OUT_TODAY = ["jamun-bouquet"];

// Words from Shakha's own captions for the products the seed left bare.
const UPDATES: Record<string, { name?: string; slug?: string; summary?: string; description?: string }> = {
  "the-litchi-bouquet": {
    description:
      "A bouquet… but make it juicy. Fresh litchis nestled in baby's breath and wrapped like flowers: something different for someone unforgettable.",
  },
  "the-coffee-bouquet": {
    description:
      "Not just coffee, it's a whole bouquet of happiness. Premium Davidoff coffee with fresh florals, for the coffee lover who deserves something a little extra.",
  },
  "ferrero-bouquet": {
    summary: "Yellow roses, Ferrero Rocher and a soft plush toy.",
    description:
      "Luxury wrapped in roses, sweetness and cuddles. Fresh yellow roses, Ferrero Rocher, baby's breath and a soft plush toy, made to make a celebration unforgettable.",
  },
  "mocktail-bouquet": {
    description:
      "Everyone gives a normal bouquet; the one they remember is the Mocktail Bouquet. For the friend who always asks “gift kya du?”",
  },
  "diet-coke-bouquet": {
    summary: "Original Diet Coke with fresh florals: the most Gen Z gift.",
    description:
      "For the one who's obsessed with Diet Coke. Cans of the original, arranged with fresh flowers, because the best surprises are always unexpected.",
  },
  "jamun-bouquet": {
    description: "When flowers are common, gift something unforgettable. Fresh jamuns, wrapped as a bouquet while they're in season.",
  },
  "laddu-bouquet": {
    description: "Iss baar Bappa ka swagat, ladduon ke saath. Laddus wrapped with flowers for Ganesh Chaturthi and festive gifting.",
  },
  "orchid-bouquet": {
    description: "Not everybody deserves orchids, but you do. Purple orchids for someone who deserves more than ordinary.",
  },
  "teddy-bear": { name: "Mini teddy", slug: "mini-teddy", summary: "A soft mini teddy to go with your flowers." },
  chocolates: { name: "Ferrero Rocher box", slug: "ferrero-rocher-box", summary: "A box of Ferrero Rocher to go with your flowers." },
};

type Photo = { file: string; alt: string };

const EXTRA_PHOTOS: (Photo & { slug: string; cover?: boolean })[] = [
  { slug: "diet-coke-bouquet", file: "diet-coke-bouquet", alt: "Diet Coke cans arranged with fresh flowers in red and gold wrapping" },
  {
    slug: "ferrero-bouquet",
    file: "ferrero-bouquet",
    alt: "Yellow roses and Ferrero Rocher around a plush toy, in pink wrapping",
    cover: true,
  },
  // The seed's photo is the wide homepage hero, which crops badly on a product card.
  { slug: "pink-rose-bouquet", file: "pink-rose-bouquet-2", alt: "Pink roses and baby's breath in a pearl-trimmed wrap", cover: true },
  { slug: "the-coffee-bouquet", file: "coffee-bouquet-2", alt: "Davidoff coffee jars with baby's breath and black feather wrapping" },
  { slug: "mini-teddy", file: "mini-teddy", alt: "A cream mini teddy in a knitted cap" },
  { slug: "ferrero-rocher-box", file: "ferrero-rocher-box", alt: "A box of Ferrero Rocher" },
];

const NEW_PRODUCTS: {
  name: string;
  slug: string;
  category: string;
  summary: string;
  description: string;
  occasions: string[];
  photos: Photo[];
}[] = [
  {
    name: "Teddy Bouquet",
    slug: "teddy-bouquet",
    category: "signature",
    summary: "A bouquet of mini teddies, wrapped in blue.",
    description:
      "Wrapped in love, sprinkled with cuddles. Because sometimes flowers aren't enough: a bouquet full of little teddies for birthdays, surprises, baby showers and just-because moments.",
    occasions: ["birthday", "love", "just-because"],
    photos: [
      { file: "teddy-bouquet", alt: "A bouquet of mini teddies in blue wrapping" },
      { file: "teddy-bouquet-2", alt: "Mini teddies bunched as a bouquet with a pink bow" },
    ],
  },
  {
    name: "Chocolate Bouquet",
    slug: "chocolate-bouquet",
    category: "signature",
    summary: "KitKat and Dairy Milk Silk with roses and baby's breath.",
    description:
      "Tried chocolate, then a fancy box, then roses? Her heart belongs to chocolate bouquets. KitKats and Dairy Milk Silk tucked among roses and baby's breath, wrapped to gift.",
    occasions: ["love", "birthday", "just-because"],
    photos: [{ file: "chocolate-bouquet", alt: "KitKat and Dairy Milk Silk bars with roses and baby's breath in white wrapping" }],
  },
  {
    name: "Pink Lily Bouquet",
    slug: "pink-lily-bouquet",
    category: "bouquets",
    summary: "Pink lilies, white roses and baby's breath.",
    description: "Fragrant pink lilies with white roses and baby's breath, hand-tied to gift.",
    occasions: ["love", "anniversary", "birthday"],
    photos: [
      { file: "pink-lily-bouquet", alt: "Pink lilies, white roses and baby's breath, hand-tied" },
      { file: "pink-lily-bouquet-2", alt: "Pink and white lilies, close up" },
    ],
  },
  {
    name: "Kraft Bag Flower Basket",
    slug: "kraft-bag-flower-basket",
    category: "bouquets",
    summary: "Peach spray roses and baby's breath in a kraft basket.",
    description:
      "Minimal look, maximum love. Peach spray roses, delicate baby's breath and fresh green leaves, arranged in a sturdy premium kraft bag basket.",
    occasions: ["birthday", "anniversary", "just-because"],
    photos: [{ file: "kraft-bag-flower-basket", alt: "Peach spray roses and baby's breath in a kraft paper basket with a pink bow" }],
  },
];

// SAMPLE orders. They use the shop's own number, so their WhatsApp buttons are safe to try.
type DemoOrder = {
  placedMinutesAgo: number;
  dayOffset: number; // delivery or pickup day, from today
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  customer: string;
  recipient?: string;
  pickup?: "vesu" | "dumas";
  area?: [area: string, pincode: string];
  lines: [slug: string, quantity: number, size?: string][];
  giftMessage?: string;
  customerNote?: string;
  adminNote?: string;
};

const DAY = 24 * 60;
const DEMO_ORDERS: DemoOrder[] = [
  {
    placedMinutesAgo: 3 * DAY,
    dayOffset: -2,
    status: "cancelled",
    customer: "Rahul Verma",
    area: ["Adajan", "395009"],
    lines: [["diet-coke-bouquet", 1]],
    adminNote: "Sample order. Customer called to cancel; plans changed.",
  },
  {
    placedMinutesAgo: 2 * DAY + 90,
    dayOffset: -1,
    status: "completed",
    paymentStatus: "paid",
    customer: "Rohan Mehta",
    recipient: "Ananya Shah",
    area: ["Piplod", "395007"],
    lines: [
      ["ferrero-bouquet", 1],
      ["mini-teddy", 1],
    ],
    giftMessage: "Happy birthday, Ananya! 🎂 Love, Rohan",
    adminNote: "Sample order. Paid in cash on delivery.",
  },
  {
    placedMinutesAgo: DAY + 200,
    dayOffset: -1,
    status: "completed",
    paymentStatus: "paid",
    customer: "Sneha Kapadia",
    pickup: "dumas",
    lines: [["the-litchi-bouquet", 1]],
    adminNote: "Sample order. Paid by UPI at the counter.",
  },
  {
    placedMinutesAgo: 190,
    dayOffset: 0,
    status: "out_for_delivery",
    customer: "Karan Patel",
    recipient: "Meera Patel",
    area: ["Vesu", "395007"],
    lines: [
      ["pink-rose-bouquet", 1, "Deluxe"],
      ["ferrero-rocher-box", 1],
    ],
    giftMessage: "Happy anniversary, Meera ❤️",
    adminNote: "Sample order.",
  },
  {
    placedMinutesAgo: 125,
    dayOffset: 0,
    status: "preparing",
    customer: "Aditya Shah",
    pickup: "vesu",
    lines: [["the-coffee-bouquet", 1]],
    customerNote: "I'll collect it around 6 pm.",
    adminNote: "Sample order.",
  },
  {
    placedMinutesAgo: 70,
    dayOffset: 1,
    status: "confirmed",
    customer: "Nisha Agarwal",
    recipient: "Kavita Agarwal",
    area: ["City Light", "395007"],
    lines: [["orchid-bouquet", 1, "Classic"]],
    giftMessage: "Thank you for everything, Maa 💐",
    adminNote: "Sample order.",
  },
  {
    placedMinutesAgo: 15,
    dayOffset: 1,
    status: "new",
    customer: "Riya Joshi",
    recipient: "Aarav Desai",
    area: ["Adajan", "395009"],
    lines: [
      ["teddy-bouquet", 1],
      ["ferrero-rocher-box", 1],
    ],
    giftMessage: "Sorry for yesterday 🙈 Friends again?",
    customerNote: "Please call before delivering.",
  },
];

// The default delivery window (Shakha's opening hours), as the checkout labels it.
const SLOT = slotLabel({ start: "08:00", end: "22:00" });
const SHOP_PHONE = site.whatsappNumber.slice(-10);

async function addPhoto(productId: number, photo: Photo, cover = false) {
  const stored = await storeImage(await readFile(path.join("media-src", "products", `${photo.file}.jpg`)));
  let sortOrder = 0;
  if (cover) {
    await db
      .update(productImages)
      .set({ sortOrder: sql`${productImages.sortOrder} + 1` })
      .where(eq(productImages.productId, productId));
  } else {
    const [last] = await db
      .select({ max: sql<number>`coalesce(max(${productImages.sortOrder}), -1)` })
      .from(productImages)
      .where(eq(productImages.productId, productId));
    sortOrder = last.max + 1;
  }
  await db.insert(productImages).values({ productId, ...stored, alt: photo.alt, sortOrder });
}

async function main() {
  const [anyOrder] = await db.select({ id: orders.id }).from(orders).limit(1);
  const [anyLive] = await db.select({ id: products.id }).from(products).where(eq(products.status, "active")).limit(1);
  if (anyOrder || anyLive) {
    console.error("This database already has orders or live products. db:demo only runs on a fresh `npm run setup`.");
    process.exitCode = 1;
    return;
  }
  const seeded = await db.select({ id: products.id, slug: products.slug }).from(products);
  if (!seeded.length) {
    console.error("No products yet. Run `npm run setup` first.");
    process.exitCode = 1;
    return;
  }

  // 1. Rename and describe the seeded products.
  for (const [slug, patch] of Object.entries(UPDATES)) {
    await db.update(products).set(patch).where(eq(products.slug, slug));
  }

  // 2. New products from Shakha's posts.
  const categoryIds = new Map((await db.select().from(categories)).map((c) => [c.slug, c.id]));
  for (const p of NEW_PRODUCTS) {
    const [row] = await db
      .insert(products)
      .values({
        name: p.name,
        slug: p.slug,
        categoryId: categoryIds.get(p.category) ?? null,
        summary: p.summary,
        description: p.description,
        occasions: p.occasions,
      })
      .returning({ id: products.id });
    for (const photo of p.photos) await addPhoto(row.id, photo);
  }

  // 3. Photos for the seeded products.
  const ids = new Map((await db.select({ id: products.id, slug: products.slug }).from(products)).map((p) => [p.slug, p.id]));
  for (const photo of EXTRA_PHOTOS) {
    const id = ids.get(photo.slug);
    if (!id) throw new Error(`No product called ${photo.slug}`);
    await addPhoto(id, photo, photo.cover);
  }

  // 4. Sample prices and sizes; everything goes live in the shop order above.
  for (const [i, slug] of DISPLAY_ORDER.entries()) {
    const id = ids.get(slug);
    if (!id) throw new Error(`No product called ${slug}`);
    const price = PRICES[slug];
    const sizes: Size[] = typeof price === "number" ? [["Standard", price]] : price;
    await db.delete(productVariants).where(eq(productVariants.productId, id));
    await db.insert(productVariants).values(sizes.map(([name, value], s) => ({ productId: id, name, price: value, sortOrder: s })));
    await db
      .update(products)
      .set({ status: "active", sortOrder: (i + 1) * 10, inStock: !SOLD_OUT_TODAY.includes(slug) })
      .where(eq(products.id, id));
  }
  const unpriced = [...ids.keys()].filter((slug) => !(slug in PRICES));
  if (unpriced.length) console.warn(`Left as drafts (no demo price): ${unpriced.join(", ")}`);

  // 5. Sample orders, oldest first so order numbers rise with time.
  const today = indiaNow().dateKey;
  for (const o of DEMO_ORDERS) {
    const lines: Omit<typeof orderItems.$inferInsert, "orderId">[] = [];
    for (const [slug, quantity, size = "Standard"] of o.lines) {
      const product = await db.query.products.findFirst({
        where: eq(products.slug, slug),
        with: {
          variants: true,
          images: { orderBy: [asc(productImages.sortOrder), asc(productImages.id)], limit: 1 },
        },
      });
      const variant = product?.variants.find((v) => v.name === size);
      if (!product || !variant || variant.price === null) throw new Error(`No ${size} size priced for ${slug}`);
      lines.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        unitPrice: variant.price,
        quantity,
        lineTotal: variant.price * quantity,
        imageKey: product.images[0]?.key ?? null,
      });
    }
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const delivery = !o.pickup;
    // No delivery fee is set (Shakha hasn't published one), so deliveries show "confirmed by Shakha".
    const deliveryFee = delivery ? null : 0;
    const placed = new Date(Date.now() - o.placedMinutesAgo * 60_000);
    const token = randomBytes(16).toString("base64url");
    const [row] = await db
      .insert(orders)
      .values({
        number: `pending-${token}`,
        token,
        status: o.status,
        paymentMethod: "pay_on_delivery",
        paymentStatus: o.paymentStatus ?? "pending",
        customerName: o.customer,
        customerPhone: SHOP_PHONE,
        fulfillment: delivery ? "delivery" : "pickup",
        pickupBranch: o.pickup ?? null,
        recipientName: delivery ? (o.recipient ?? o.customer) : null,
        recipientPhone: delivery ? SHOP_PHONE : null,
        addressLine: delivery ? "Flat 402, Sample Residency" : null,
        area: o.area?.[0] ?? null,
        pincode: o.area?.[1] ?? null,
        deliveryDate: addDays(today, o.dayOffset),
        deliverySlot: SLOT,
        giftMessage: o.giftMessage ?? "",
        customerNote: o.customerNote ?? "",
        adminNote: o.adminNote ?? "",
        subtotal,
        deliveryFee,
        total: subtotal + (deliveryFee ?? 0),
        createdAt: placed,
        updatedAt: placed,
      })
      .returning({ id: orders.id });
    await db
      .update(orders)
      .set({ number: `SH${1000 + row.id}`, updatedAt: placed })
      .where(eq(orders.id, row.id));
    await db.insert(orderItems).values(lines.map((l) => ({ orderId: row.id, ...l })));
  }

  console.log(
    `Demo shop ready: ${DISPLAY_ORDER.length} live products with SAMPLE prices, ${DEMO_ORDERS.length} sample orders.\n` +
      "Sign in with an admin made by `npm run admin:create`. Replace the sample prices before taking real orders.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => dbClient.close());
