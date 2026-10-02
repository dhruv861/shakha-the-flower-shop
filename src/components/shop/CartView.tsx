"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { whatsappLink } from "@/lib/site";
import { cartEnquiry } from "@/lib/whatsapp";
import { WhatsAppIcon } from "../Icons";
import { cart, useCart, useHydrated } from "./cart-store";
import ProductImage from "./ProductImage";
import { useLivePrices } from "./useLivePrices";
import styles from "./CartView.module.css";

type Props = {
  acceptingOrders: boolean;
  closedMessage: string;
  deliveryNote: string;
};

export default function CartView({ acceptingOrders, closedMessage, deliveryNote }: Props) {
  const lines = useCart();
  const hydrated = useHydrated();
  const { issues, subtotal, loading } = useLivePrices(lines, hydrated && lines.length > 0);

  if (!hydrated) return <p className={styles.loading}>Loading your cart…</p>;

  if (!lines.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Your cart is empty.</p>
        <Link href="/shop" className="btn btn-primary">
          Browse the shop
        </Link>
      </div>
    );
  }

  const blocked = issues.size > 0 || !acceptingOrders;
  // The WhatsApp question lists the cart as shown here, lines and subtotal.
  const whatsappHref = whatsappLink(
    cartEnquiry(
      lines.map((l) => ({ name: l.name, variantName: l.variantName, quantity: l.quantity, unitPrice: l.unitPrice })),
      subtotal,
    ),
  );

  return (
    <div className={styles.layout}>
      <ul className={styles.lines} role="list">
        {lines.map((line) => (
          <li key={line.variantId} className={styles.line}>
            <Link href={`/shop/${line.slug}`} className={styles.thumb} tabIndex={-1} aria-hidden="true">
              <ProductImage image={line.image} alt="" sizes="96px" />
            </Link>
            <div className={styles.lineBody}>
              <Link href={`/shop/${line.slug}`} className={styles.lineName}>
                {line.name}
              </Link>
              {line.variantName !== "Standard" && <span className={styles.lineMeta}>{line.variantName}</span>}
              <span className={styles.lineMeta}>{formatPrice(line.unitPrice)} each</span>
              {issues.get(line.variantId) && <span className={styles.issue}>{issues.get(line.variantId)}</span>}
              <div className={styles.lineControls}>
                <div className={styles.stepper} role="group" aria-label={`Quantity of ${line.name}`}>
                  <button
                    type="button"
                    onClick={() => cart.setQuantity(line.variantId, line.quantity - 1)}
                    aria-label="One fewer"
                  >
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => cart.setQuantity(line.variantId, line.quantity + 1)}
                    aria-label="One more"
                  >
                    +
                  </button>
                </div>
                <button type="button" className={styles.remove} onClick={() => cart.remove(line.variantId)}>
                  Remove
                </button>
              </div>
            </div>
            <span className={styles.lineTotal}>{formatPrice(line.unitPrice * line.quantity)}</span>
          </li>
        ))}
      </ul>

      <aside className={styles.summary}>
        <dl className={styles.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>{deliveryNote}</dd>
          </div>
        </dl>
        {!acceptingOrders && <p className={styles.issue}>{closedMessage}</p>}
        {issues.size > 0 && <p className={styles.issue}>Remove the items marked above to continue.</p>}
        {blocked ? (
          <span className={`btn btn-primary ${styles.checkout}`} aria-disabled="true">
            Checkout
          </span>
        ) : (
          <Link href="/checkout" className={`btn btn-primary ${styles.checkout}`} aria-busy={loading}>
            Checkout
          </Link>
        )}
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`btn btn-outline ${styles.whatsapp}`}>
          <WhatsAppIcon />
          Ask about this on WhatsApp
        </a>
        <Link href="/shop" className={styles.continue}>
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
