import type { Metadata } from "next";
import Link from "next/link";
import { whatsappLink } from "@/lib/site";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found — Shakha The Flower Shop",
};

export default function NotFound() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.logo}>
        <span className={styles.logoMark}>Shakha</span>{" "}
        <span className={styles.logoSub}>The Flower Shop</span>
      </Link>
      <span className="eyebrow">404</span>
      <h1 className="display">
        This page has <em>wandered off.</em>
      </h1>
      <p className="lead">The flowers are still here. Head back home, or tell us what you were looking for.</p>
      <div className={styles.actions}>
        <Link href="/" className="btn btn-primary">
          Back to the homepage
        </Link>
        <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          Ask on WhatsApp
        </a>
      </div>
    </main>
  );
}
