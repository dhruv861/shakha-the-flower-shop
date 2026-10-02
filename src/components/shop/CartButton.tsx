"use client";

import Link from "next/link";
import { useCartCount } from "./cart-store";
import styles from "./CartButton.module.css";

export function BagIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
    </svg>
  );
}

export default function CartButton({ className }: { className?: string }) {
  const count = useCartCount();
  return (
    <Link
      href="/cart"
      className={`${styles.button} ${className ?? ""}`}
      aria-label={count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart, empty"}
    >
      <BagIcon />
      {count > 0 && (
        <span className={styles.count} aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
