"use client";

import Link from "next/link";
import { useState } from "react";
import type { StoredImage } from "@/lib/media";
import { formatPrice } from "@/lib/money";
import { WhatsAppIcon } from "../Icons";
import { cart } from "./cart-store";
import ProductImage from "./ProductImage";
import styles from "./AddToCart.module.css";

type Variant = { id: number; name: string; price: number };
type Addon = {
  productId: number;
  slug: string;
  name: string;
  variantId: number;
  variantName: string;
  price: number;
  image: StoredImage | null;
};

type Props = {
  product: { id: number; slug: string; name: string; image: StoredImage | null };
  variants: Variant[];
  addons: Addon[];
  canOrder: boolean;
  unavailableMessage: string;
  whatsappHref: string;
};

export default function AddToCart({ product, variants, addons, canOrder, unavailableMessage, whatsappHref }: Props) {
  const [variantId, setVariantId] = useState(variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const [chosen, setChosen] = useState<number[]>([]);
  const [added, setAdded] = useState(false);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const addonTotal = addons.filter((a) => chosen.includes(a.variantId)).reduce((sum, a) => sum + a.price, 0);

  function add() {
    cart.add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantName: variant.name,
        unitPrice: variant.price,
        image: product.image,
      },
      quantity,
    );
    for (const a of addons.filter((x) => chosen.includes(x.variantId))) {
      cart.add({
        variantId: a.variantId,
        productId: a.productId,
        slug: a.slug,
        name: a.name,
        variantName: a.variantName,
        unitPrice: a.price,
        image: a.image,
      });
    }
    setAdded(true);
    setChosen([]);
  }

  return (
    <div className={styles.panel}>
      <p className={styles.price}>
        {formatPrice(variant.price * quantity + addonTotal)}
        {(quantity > 1 || addonTotal > 0) && (
          <span className={styles.priceNote}>
            {quantity > 1 ? ` ${quantity} × ${formatPrice(variant.price)}` : ""}
            {addonTotal > 0 ? ` + add-ons` : ""}
          </span>
        )}
      </p>

      {variants.length > 1 && (
        <fieldset className={styles.group}>
          <legend className={styles.label}>Size</legend>
          <div className={styles.options}>
            {variants.map((v) => (
              <label key={v.id} className={styles.option}>
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={v.id === variantId}
                  onChange={() => setVariantId(v.id)}
                />
                <span>{v.name}</span>
                <span className={styles.optionPrice}>{formatPrice(v.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {addons.length > 0 && canOrder && (
        <fieldset className={styles.group}>
          <legend className={styles.label}>Make it a gift</legend>
          <div className={styles.addons}>
            {addons.map((a) => (
              <label key={a.variantId} className={styles.addon}>
                <input
                  type="checkbox"
                  checked={chosen.includes(a.variantId)}
                  onChange={(e) =>
                    setChosen((c) => (e.target.checked ? [...c, a.variantId] : c.filter((id) => id !== a.variantId)))
                  }
                />
                <span className={styles.addonImage}>
                  <ProductImage image={a.image} alt="" sizes="48px" />
                </span>
                <span className={styles.addonName}>{a.name}</span>
                <span className={styles.optionPrice}>+{formatPrice(a.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {canOrder ? (
        <div className={styles.buy}>
          <div className={styles.stepper} role="group" aria-label="Quantity">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="One fewer">
              −
            </button>
            <span aria-live="polite">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => Math.min(20, q + 1))} aria-label="One more">
              +
            </button>
          </div>
          <button type="button" className={`btn btn-primary ${styles.addButton}`} onClick={add}>
            Add to cart
          </button>
        </div>
      ) : (
        <p className={styles.unavailable}>{unavailableMessage}</p>
      )}

      {added && (
        <div className={styles.added} role="status">
          <span>Added to your cart.</span>
          <span className={styles.addedLinks}>
            <Link href="/cart">View cart</Link>
            <Link href="/checkout" className={styles.checkoutLink}>
              Checkout
            </Link>
          </span>
        </div>
      )}

      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`btn btn-outline ${styles.whatsapp}`}>
        <WhatsAppIcon />
        Ask about this on WhatsApp
      </a>
    </div>
  );
}
