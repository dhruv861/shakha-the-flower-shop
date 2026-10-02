// Occasion tags a product can carry; the shop filters on them.
export const OCCASIONS = [
  { slug: "love", label: "Love & romance" },
  { slug: "birthday", label: "Birthdays" },
  { slug: "anniversary", label: "Anniversaries" },
  { slug: "just-because", label: "Just because" },
  { slug: "sorry", label: "Apologies" },
] as const;

export type OccasionSlug = (typeof OCCASIONS)[number]["slug"];

export function occasionLabel(slug: string) {
  return OCCASIONS.find((o) => o.slug === slug)?.label ?? slug;
}

export function isOccasion(slug: string): slug is OccasionSlug {
  return OCCASIONS.some((o) => o.slug === slug);
}
