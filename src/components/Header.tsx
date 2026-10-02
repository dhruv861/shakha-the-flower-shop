"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import { site, whatsappLink } from "@/lib/site";
import CartButton from "./shop/CartButton";
import { ArrowIcon, CloseIcon, InstagramIcon, MenuIcon, PhoneIcon, WhatsAppIcon } from "./Icons";
import styles from "./Header.module.css";

// Absolute links so the header works the same on the shop pages.
const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/#occasions", label: "Occasions" },
  { href: "/#weddings", label: "Weddings & décor" },
  { href: "/#visit", label: "Visit us" },
];

function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link href="/" className={`${styles.logo} ${className ?? ""}`} onClick={onClick}>
      <span className={styles.logoMark}>Shakha</span>{" "}
      <span className={styles.logoSub}>The Flower Shop</span>
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // While the menu is open: lock page scroll, move focus in, close on Escape.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    // The menu only exists below 1024px; don't leave it stuck open on resize.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      root.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  // Keep Tab inside the open menu.
  const trapFocus = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !menuRef.current) return;
    const focusable = menuRef.current.querySelectorAll<HTMLElement>("a[href], button");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Logo />

          <nav aria-label="Main" className={styles.nav}>
            {NAV.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <a href={site.phone.href} className={styles.phone}>
              <PhoneIcon size={16} />
              {site.phone.display}
            </a>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn btn-primary ${styles.cta}`}
            >
              <WhatsAppIcon />
              <span className={styles.ctaLabel}>Order on WhatsApp</span>
            </a>
            <CartButton />
            <button
              ref={toggleRef}
              type="button"
              className={styles.menuButton}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-menu"
        ref={menuRef}
        className={styles.menu}
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        onKeyDown={trapFocus}
      >
        <div className={styles.menuBar}>
          <div className={styles.inner}>
            <Logo onClick={() => setOpen(false)} />
            <button
              ref={closeRef}
              type="button"
              className={styles.menuButton}
              aria-label="Close menu"
              onClick={() => {
                setOpen(false);
                toggleRef.current?.focus();
              }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className={styles.menuBody}>
          <nav aria-label="Menu" className={styles.menuNav}>
            {[...NAV, { href: "/cart", label: "Your cart" }].map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{ "--i": i } as CSSProperties}
              >
                {link.label}
                <ArrowIcon size={20} />
              </Link>
            ))}
          </nav>

          <div className={styles.menuContact}>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <WhatsAppIcon />
              Order on WhatsApp
            </a>
            <a href={site.phone.href} className="btn btn-outline">
              <PhoneIcon size={16} />
              Call {site.phone.display}
            </a>
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className={styles.menuInstagram}>
              <InstagramIcon />@{site.instagram.handle}
            </a>
          </div>

          <p className={styles.menuMeta}>Same-day delivery in Surat · Open daily from 8 AM</p>
        </div>
      </div>
    </>
  );
}
