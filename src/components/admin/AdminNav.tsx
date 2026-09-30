"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/account", label: "Account" },
];

export default function AdminNav({ newOrders }: { newOrders: number }) {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Admin">
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} className={styles.navLink} aria-current={active ? "page" : undefined}>
            {link.label}
            {link.href === "/admin/orders" && newOrders > 0 && (
              <span className={styles.navBadge} aria-label={`${newOrders} new`}>
                {newOrders}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
