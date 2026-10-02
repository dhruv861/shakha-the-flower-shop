import "server-only";
import { asc, eq } from "drizzle-orm";
import { cache } from "react";
import { categories, db, productImages, products, productVariants } from "@/db";
import type { StoredImage } from "./media";

// What the storefront reads. Only "active" products with at least one priced
// size are ever shown; drafts and unpriced items stay in the admin.

type ImageRow = typeof productImages.$inferSelect;
type VariantRow = typeof productVariants.$inferSelect;

export type ShopCard = {
  id: number;
  name: string;
  slug: string;
  summary: string;
  inStock: boolean;
  isAddon: boolean;
  featured: boolean;
  categorySlug: string | null;
  categoryName: string | null;
  occasions: string[];
  minPrice: number;
  variantCount: number;
  cheapestVariantId: number;
  cheapestVariantName: string;
  image: StoredImage | null;
};

export function toStoredImage(img: ImageRow): StoredImage {
  return { key: img.key, widths: img.widths, width: img.width, height: img.height, alt: img.alt };
}

export function pricedVariants(variants: VariantRow[]) {
  return variants
    .filter((v): v is VariantRow & { price: number } => v.price !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.price - b.price);
}

type ProductWithCardData = typeof products.$inferSelect & {
  category: typeof categories.$inferSelect | null;
  variants: VariantRow[];
  images: ImageRow[];
};

function toCard(p: ProductWithCardData): ShopCard | null {
  const priced = pricedVariants(p.variants);
  if (!priced.length) return null;
  const cheapest = priced.reduce((a, b) => (b.price < a.price ? b : a));
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    summary: p.summary,
    inStock: p.inStock,
    isAddon: p.isAddon,
    featured: p.featured,
    categorySlug: p.category?.slug ?? null,
    categoryName: p.category?.name ?? null,
    occasions: p.occasions,
    minPrice: cheapest.price,
    variantCount: priced.length,
    cheapestVariantId: cheapest.id,
    cheapestVariantName: cheapest.name,
    image: p.images[0] ? toStoredImage(p.images[0]) : null,
  };
}

const activeCards = cache(async () => {
  const rows = await db.query.products.findMany({
    where: eq(products.status, "active"),
    with: {
      category: true,
      variants: { orderBy: [asc(productVariants.sortOrder)] },
      images: { orderBy: [asc(productImages.sortOrder), asc(productImages.id)], limit: 1 },
    },
    orderBy: [asc(products.sortOrder), asc(products.name)],
  });
  return rows.map(toCard).filter((c): c is ShopCard => c !== null);
});

export async function listShopProducts(filter: { category?: string; occasion?: string } = {}) {
  const cards = await activeCards();
  return cards.filter((c) => {
    if (filter.category) return c.categorySlug === filter.category;
    if (c.isAddon) return false;
    return filter.occasion ? c.occasions.includes(filter.occasion) : true;
  });
}

export async function listAddons() {
  return (await activeCards()).filter((c) => c.isAddon && c.inStock);
}

/** Categories that currently have something to buy, in admin order. */
export async function listShopCategories() {
  const cards = await activeCards();
  const used = new Set(cards.map((c) => c.categorySlug));
  const all = await db.query.categories.findMany({ orderBy: [asc(categories.sortOrder), asc(categories.name)] });
  return all.filter((c) => used.has(c.slug));
}

/** Lowest live price per category slug, for "Bouquets from ₹…" lines. */
export async function startingPrices() {
  const prices: Record<string, number> = {};
  for (const c of await activeCards()) {
    if (!c.categorySlug) continue;
    prices[c.categorySlug] = Math.min(prices[c.categorySlug] ?? Infinity, c.minPrice);
  }
  return prices;
}

/** Live price and link state for specific products (the homepage's signature cards). */
export async function cardsBySlug(slugs: string[]) {
  const cards = await activeCards();
  return Object.fromEntries(slugs.map((s) => [s, cards.find((c) => c.slug === s) ?? null]));
}

export async function getShopProduct(slug: string) {
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      category: true,
      variants: { orderBy: [asc(productVariants.sortOrder)] },
      images: { orderBy: [asc(productImages.sortOrder), asc(productImages.id)] },
    },
  });
  if (!product || product.status !== "active") return null;
  const variants = pricedVariants(product.variants);
  if (!variants.length) return null;
  return { ...product, variants, images: product.images.map(toStoredImage) };
}

export async function relatedProducts(product: { id: number; categoryId: number | null }, limit = 4) {
  const cards = await activeCards();
  const categorySlug = (await db.query.categories.findFirst({
    where: eq(categories.id, product.categoryId ?? -1),
  }))?.slug;
  const same = cards.filter((c) => c.id !== product.id && !c.isAddon && c.categorySlug === categorySlug);
  const others = cards.filter((c) => c.id !== product.id && !c.isAddon && c.categorySlug !== categorySlug);
  return [...same, ...others].slice(0, limit);
}

export async function activeProductSlugs() {
  return (await activeCards()).map((c) => c.slug);
}
