import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/Icons";
import ProductCard from "@/components/shop/ProductCard";
import ui from "@/components/shop/shop-ui.module.css";
import { listShopCategories, listShopProducts } from "@/lib/catalog";
import { formatTime } from "@/lib/delivery";
import { isOccasion, OCCASIONS, occasionLabel } from "@/lib/occasions";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop flowers & gifts online — Shakha The Flower Shop, Surat",
  description:
    "Order bouquets, signature creations and gift hampers online for delivery across Surat, or pick up from our Vesu and Dumas studios.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const occasion = typeof params.occasion === "string" && isOccasion(params.occasion) ? params.occasion : undefined;

  const [cards, allCards, categories, settings] = await Promise.all([
    listShopProducts({ category, occasion }),
    listShopProducts(),
    listShopCategories(),
    getSettings(),
  ]);
  const activeCategory = categories.find((c) => c.slug === category);
  const occasionsInUse = OCCASIONS.filter((o) => allCards.some((c) => c.occasions.includes(o.slug)));
  const heading = activeCategory?.name ?? (occasion ? occasionLabel(occasion) : "Flowers & gifts");
  const nothingLive = allCards.length === 0;

  return (
    <div className={ui.page}>
      <div className="container">
        <header className={ui.head}>
          <span className="eyebrow">Shop online</span>
          <h1 className={`display ${ui.title}`}>{heading}</h1>
          <p className="lead">
            {activeCategory?.description ||
              "Order online for delivery across Surat, or pick up from our Vesu and Dumas studios."}
          </p>
          {!settings.acceptingOrders ? (
            <p className={ui.notice}>
              {settings.closedMessage}{" "}
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                Message us on WhatsApp
              </a>
            </p>
          ) : (
            settings.sameDayCutoff && (
              <p className={ui.meta}>Order by {formatTime(settings.sameDayCutoff)} for same-day delivery.</p>
            )
          )}
        </header>

        {!nothingLive && (
          <nav aria-label="Filter the shop" className={ui.filters}>
            <div className={ui.chipRow}>
              <Link href="/shop" className={ui.chip} aria-current={!category && !occasion ? "true" : undefined}>
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?category=${c.slug}`}
                  className={ui.chip}
                  aria-current={c.slug === category ? "true" : undefined}
                >
                  {c.name}
                </Link>
              ))}
            </div>
            {occasionsInUse.length > 0 && (
              <div className={ui.chipRow}>
                {occasionsInUse.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/shop?occasion=${o.slug}`}
                    className={ui.chipSoft}
                    aria-current={o.slug === occasion ? "true" : undefined}
                  >
                    {o.label}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        )}

        {cards.length > 0 ? (
          <ul className={ui.grid} role="list">
            {cards.map((card, i) => (
              <li key={card.id}>
                <ProductCard product={card} priority={i < 4} />
              </li>
            ))}
          </ul>
        ) : (
          <div className={ui.empty}>
            <p className={ui.emptyTitle}>
              {nothingLive ? "Our online shop opens soon." : "Nothing here right now."}
            </p>
            <p className="lead">
              Tell us what you have in mind and we&apos;ll make it for you, or browse everything we have today.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <WhatsAppIcon />
                Order on WhatsApp
              </a>
              {!nothingLive && (
                <Link href="/shop" className="btn btn-outline">
                  See everything
                </Link>
              )}
            </div>
          </div>
        )}

        <aside className={ui.band}>
          <div>
            <p className={ui.bandTitle}>Want something made just for you?</p>
            <p className={ui.bandText}>Send us your idea, budget and occasion. Our florists will design it.</p>
          </div>
          <a
            href={whatsappLink("Hi Shakha! I'd like a custom bouquet.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            <WhatsAppIcon />
            Plan it on WhatsApp
          </a>
        </aside>
      </div>
    </div>
  );
}
