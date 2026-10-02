import Link from "next/link";
import type { ReactNode } from "react";
import { startingPrices } from "@/lib/catalog";
import { formatTime } from "@/lib/delivery";
import { formatPrice } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { ClockIcon, SproutIcon, TruckIcon } from "./Icons";
import Picture from "./Picture";
import styles from "./PromiseSection.module.css";

const promises = (cutoff: string | null): { icon: ReactNode; title: string; text: string }[] => [
  {
    icon: <TruckIcon size={22} />,
    title: "Same-day delivery",
    text: `Across Surat${cutoff ? ` when you order by ${cutoff}` : ""}. Home or office, we'll bring it to the door.`,
  },
  {
    icon: <SproutIcon size={22} />,
    title: "Made your way",
    text: "Your flowers, your colours, your wrap. Tell us the budget and the mood — we'll handle the rest.",
  },
  {
    icon: <ClockIcon size={22} />,
    title: "Last minute? Tension nahi.",
    text: "Call or WhatsApp and we'll get it ready. Flowers hum sambhaal lenge.",
  },
];

const PRICE_BANDS = [
  { label: "Bouquets", category: "bouquets" },
  { label: "Signature", more: " creations", category: "signature" },
  { label: "Hampers", category: "hampers" },
];

// Starting prices and the cut-off come from the admin panel. Only categories
// with something to order today get a price, and the cut-off is left out
// until one is set, as on the shop pages.
export default async function PromiseSection() {
  const [prices, settings] = await Promise.all([startingPrices(), getSettings()]);
  const cutoff = settings.sameDayCutoff ? formatTime(settings.sameDayCutoff) : null;
  const bands = PRICE_BANDS.filter((item) => prices[item.category] !== undefined);
  return (
    <section className={styles.section} aria-label="Why Shakha">
      <Picture name="texture-ivory-petals" alt="" sizes="100vw" className={styles.texture} />
      <div className={`container ${styles.inner}`}>
        <ul className={styles.list} role="list">
          {promises(cutoff).map((item, i) => (
            <li key={item.title} className={`${styles.item} rise`} data-d={i}>
              <span className={styles.icon}>{item.icon}</span>
              <div className={styles.itemText}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <p className={styles.itemCopy}>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>

        {bands.length > 0 && (
          <div className={`${styles.band} rise`}>
            <div className={styles.bandText}>
              <h3 className={styles.bandTitle}>A bouquet for every budget</h3>
              <p className={styles.bandSub}>From a single stem to a statement piece.</p>
            </div>
            <ul className={styles.pills} role="list">
              {bands.map((item) => (
                <li key={item.label}>
                  <Link href={`/shop?category=${item.category}`} className={styles.pill}>
                    <span>
                      {item.label}
                      {item.more && <span className={styles.wideOnly}>{item.more}</span>} from
                    </span>
                    <strong>{formatPrice(prices[item.category])}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
