import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/shop/AddToCart";
import ProductCard from "@/components/shop/ProductCard";
import ProductGallery from "@/components/shop/ProductGallery";
import ui from "@/components/shop/shop-ui.module.css";
import { activeProductSlugs, getShopProduct, listAddons, relatedProducts } from "@/lib/catalog";
import { formatTime } from "@/lib/delivery";
import { fallbackWidth, mediaUrl } from "@/lib/media";
import { occasionLabel } from "@/lib/occasions";
import { getSettings } from "@/lib/settings";
import { site, whatsappLink } from "@/lib/site";
import styles from "./product.module.css";

export async function generateStaticParams() {
  return (await activeProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const product = await getShopProduct((await params).slug);
  if (!product) return {};
  const image = product.images[0];
  return {
    title: `${product.name} — Shakha The Flower Shop, Surat`,
    description: product.summary,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: image
      ? { images: [{ url: mediaUrl(image.key, fallbackWidth(image.widths), "jpg"), alt: image.alt || product.name }] }
      : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const product = await getShopProduct((await params).slug);
  if (!product) notFound();

  const [addons, related, settings] = await Promise.all([
    listAddons(),
    relatedProducts(product),
    getSettings(),
  ]);
  const canOrder = settings.acceptingOrders && product.inStock;
  const unavailableMessage = !settings.acceptingOrders
    ? settings.closedMessage
    : "Sold out for today. Message us on WhatsApp and we'll see what we can do.";
  const cheapest = Math.min(...product.variants.map((v) => v.price));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    url: `${site.url}/shop/${product.slug}`,
    // Local photos have relative URLs; photos in Vercel Blob are already absolute.
    image: product.images.map((i) => new URL(mediaUrl(i.key, fallbackWidth(i.widths), "jpg"), site.url).href),
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: cheapest,
      highPrice: Math.max(...product.variants.map((v) => v.price)),
      offerCount: product.variants.length,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className={ui.page}>
      <div className="container">
        <nav aria-label="Breadcrumb" className={styles.crumbs}>
          <Link href="/shop">Shop</Link>
          {product.category && (
            <>
              <span aria-hidden="true">/</span>
              <Link href={`/shop?category=${product.category.slug}`}>{product.category.name}</Link>
            </>
          )}
        </nav>

        <div className={styles.layout}>
          <ProductGallery images={product.images} name={product.name} />

          <div className={styles.info}>
            <h1 className={`display ${styles.title}`}>{product.name}</h1>
            {product.summary && <p className={styles.summary}>{product.summary}</p>}

            <AddToCart
              product={{ id: product.id, slug: product.slug, name: product.name, image: product.images[0] ?? null }}
              variants={product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price }))}
              addons={
                product.isAddon
                  ? []
                  : addons.map((a) => ({
                      productId: a.id,
                      slug: a.slug,
                      name: a.name,
                      variantId: a.cheapestVariantId,
                      variantName: a.cheapestVariantName,
                      price: a.minPrice,
                      image: a.image,
                    }))
              }
              canOrder={canOrder}
              unavailableMessage={unavailableMessage}
              whatsappHref={whatsappLink(`Hi Shakha! I have a question about ${product.name}.`)}
            />

            {product.description && (
              <div className={styles.description}>
                {product.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            <ul className={styles.facts} role="list">
              <li>
                <strong>Delivery across Surat.</strong>{" "}
                {settings.sameDayCutoff
                  ? `Order by ${formatTime(settings.sameDayCutoff)} for same-day delivery.`
                  : "Same-day delivery available."}
              </li>
              {settings.pickupEnabled && (
                <li>
                  <strong>Or pick it up</strong> from our Vesu or Dumas studio.
                </li>
              )}
              <li>
                <strong>Made fresh to order</strong>, so every piece is a little different from the photo.
              </li>
            </ul>

            {product.occasions.length > 0 && (
              <div className={styles.tags}>
                {product.occasions.map((o) => (
                  <Link key={o} href={`/shop?occasion=${o}`} className={ui.chipSoft}>
                    {occasionLabel(o)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className={styles.related} aria-labelledby="related-title">
            <h2 id="related-title" className={`display ${styles.relatedTitle}`}>
              You may also like
            </h2>
            <ul className={ui.grid} role="list">
              {related.map((card) => (
                <li key={card.id}>
                  <ProductCard product={card} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
