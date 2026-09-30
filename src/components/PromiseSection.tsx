import type { ReactNode } from "react";
import { site } from "@/lib/site";
import { ClockIcon, SproutIcon, TruckIcon } from "./Icons";
import Picture from "./Picture";
import styles from "./PromiseSection.module.css";

const PROMISES: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <TruckIcon size={22} />,
    title: "Same-day delivery",
    text: `Across Surat when you order by ${site.sameDayCutoff}. Home or office, we'll bring it to the door.`,
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

const PRICES = [
  { label: "Bouquets", price: site.prices.bouquets },
  { label: "Signature", more: " creations", price: site.prices.signature },
  { label: "Hampers", price: site.prices.hampers },
];

export default function PromiseSection() {
  return (
    <section className={styles.section} aria-label="Why Shakha">
      <Picture name="texture-ivory-petals" alt="" sizes="100vw" className={styles.texture} />
      <div className={`container ${styles.inner}`}>
        <ul className={styles.list} role="list">
          {PROMISES.map((item, i) => (
            <li key={item.title} className={`${styles.item} rise`} data-d={i}>
              <span className={styles.icon}>{item.icon}</span>
              <div className={styles.itemText}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <p className={styles.itemCopy}>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className={`${styles.band} rise`}>
          <div className={styles.bandText}>
            <h3 className={styles.bandTitle}>A bouquet for every budget</h3>
            <p className={styles.bandSub}>From a single stem to a statement piece.</p>
          </div>
          <ul className={styles.pills} role="list">
            {PRICES.map((item) => (
              <li key={item.label} className={styles.pill}>
                <span>
                  {item.label}
                  {item.more && <span className={styles.wideOnly}>{item.more}</span>} from
                </span>
                <strong>₹{item.price}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
