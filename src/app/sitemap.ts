import type { MetadataRoute } from "next";
import { activeProductSlugs } from "@/lib/catalog";
import { site } from "@/lib/site";

// Rebuilt at most hourly, so new products appear without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await activeProductSlugs();
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...slugs.map((slug) => ({ url: `${site.url}/shop/${slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
