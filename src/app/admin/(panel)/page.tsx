import type { Metadata } from "next";
import Link from "next/link";
import AutoRefresh from "@/components/admin/AutoRefresh";
import { StatusBadge } from "@/components/admin/Badges";
import styles from "@/components/admin/admin.module.css";
import { dashboardData } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const [d, settings] = await Promise.all([dashboardData(), getSettings()]);
  const newCount = d.byStatus.new ?? 0;
  const inProgress = (d.byStatus.confirmed ?? 0) + (d.byStatus.preparing ?? 0);
  const todayCount = d.upcoming.filter((o) => o.deliveryDate === d.today).length;

  const checklist = [
    {
      done: d.products.live > 0,
      text:
        d.products.live > 0
          ? `${d.products.live} product${d.products.live === 1 ? " is" : "s are"} live in the shop`
          : "Set prices and make your first products live",
      href: "/admin/products",
    },
    { done: settings.sameDayCutoff !== "", text: "Set the same-day delivery cut-off time", href: "/admin/settings" },
    { done: settings.deliveryFee !== null, text: "Set your delivery charge (or mark delivery free)", href: "/admin/settings" },
    { done: settings.upiId !== "", text: "Optional: add a UPI ID so customers can pay online", href: "/admin/settings" },
  ];
  const setupLeft = checklist.filter((c) => !c.done).length;

  return (
    <div className={styles.stack}>
      <AutoRefresh />
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Hello, {admin.name.split(" ")[0]}</h1>
          <p className={styles.pageSub}>Here&apos;s the shop at a glance. This page refreshes itself every minute.</p>
        </div>
      </div>

      <div className={styles.stats}>
        <Link href="/admin/orders?view=new" className={styles.stat} data-tone={newCount ? "alert" : undefined}>
          <span className={styles.statValue}>{newCount}</span>
          <span className={styles.statLabel}>New orders to confirm</span>
        </Link>
        <Link href="/admin/orders?view=today" className={styles.stat}>
          <span className={styles.statValue}>{todayCount}</span>
          <span className={styles.statLabel}>Open orders due today</span>
        </Link>
        <Link href="/admin/orders" className={styles.stat}>
          <span className={styles.statValue}>{inProgress}</span>
          <span className={styles.statLabel}>Confirmed or being made</span>
        </Link>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatPrice(d.weekSales)}</span>
          <span className={styles.statLabel}>
            Last 7 days · {d.weekOrders} order{d.weekOrders === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {setupLeft > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Finish setting up the shop</h2>
          <ul className={styles.stack} role="list" style={{ gap: 10 }}>
            {checklist.map((item) => (
              <li key={item.text}>
                <Link href={item.href} className={styles.check}>
                  <input type="checkbox" checked={item.done} readOnly tabIndex={-1} aria-hidden="true" />
                  <span>{item.text}</span>
                </Link>
              </li>
            ))}
          </ul>
          {!settings.acceptingOrders && (
            <p className={styles.notice} style={{ marginTop: 14 }}>
              Online orders are switched off in Settings.
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className={styles.cardTitle}>Due today and tomorrow</h2>
        <div className={styles.list}>
          {d.upcoming.length ? (
            d.upcoming.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className={styles.row}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>
                    {o.number} · {o.deliveryDate === d.today ? "Today" : "Tomorrow"}, {o.deliverySlot}
                  </span>
                  <span className={styles.rowMeta}>
                    {o.fulfillment === "pickup"
                      ? `Pickup at ${o.pickupBranch === "dumas" ? "Dumas" : "Vesu"} · ${o.customerName}`
                      : `To ${o.recipientName ?? o.customerName}${o.area ? `, ${o.area}` : ""}`}
                  </span>
                </span>
                <span className={styles.rowSide}>
                  <StatusBadge status={o.status} />
                </span>
              </Link>
            ))
          ) : (
            <p className={styles.empty}>Nothing due today or tomorrow.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className={styles.cardTitle}>Latest orders</h2>
        <div className={styles.list}>
          {d.recent.length ? (
            d.recent.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className={styles.row}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>
                    {o.number} · {o.customerName}
                  </span>
                  <span className={styles.rowMeta}>
                    Placed {o.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </span>
                <span className={styles.rowSide}>
                  <span className={styles.money}>{formatPrice(o.total)}</span>
                  <StatusBadge status={o.status} />
                </span>
              </Link>
            ))
          ) : (
            <p className={styles.empty}>No orders yet. They&apos;ll appear here as soon as customers check out.</p>
          )}
        </div>
      </section>
    </div>
  );
}
