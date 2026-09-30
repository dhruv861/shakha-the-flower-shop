import type { Metadata } from "next";
import Link from "next/link";
import AutoRefresh from "@/components/admin/AutoRefresh";
import { PaymentBadge, StatusBadge } from "@/components/admin/Badges";
import styles from "@/components/admin/admin.module.css";
import { listOrders, ORDER_VIEWS, type OrderView } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { dateChip, indiaNow } from "@/lib/delivery";
import { formatPrice } from "@/lib/money";
import { formatPhone } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const params = await searchParams;
  const view: OrderView =
    typeof params.view === "string" && params.view in ORDER_VIEWS ? (params.view as OrderView) : "active";
  const q = typeof params.q === "string" ? params.q.slice(0, 60) : "";
  const rows = await listOrders(view, q);
  const today = indiaNow().dateKey;

  return (
    <div>
      <AutoRefresh />
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Orders</h1>
          <p className={styles.pageSub}>New orders appear here within a minute.</p>
        </div>
      </div>

      <nav className={styles.tabs} aria-label="Order views">
        {(Object.keys(ORDER_VIEWS) as OrderView[]).map((key) => (
          <Link
            key={key}
            href={key === "active" ? "/admin/orders" : `/admin/orders?view=${key}`}
            className={styles.tab}
            aria-current={key === view ? "true" : undefined}
          >
            {ORDER_VIEWS[key]}
          </Link>
        ))}
      </nav>

      <form className={styles.toolbar} role="search">
        {view !== "active" && <input type="hidden" name="view" value={view} />}
        <input
          className={styles.input}
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search order number, name or phone"
          aria-label="Search orders"
        />
        <button type="submit" className={`btn btn-outline ${styles.small}`}>
          Search
        </button>
      </form>

      <div className={styles.list}>
        {rows.length ? (
          rows.map((o) => {
            const chip = dateChip(o.deliveryDate, today);
            return (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className={styles.row}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>
                    {o.number} · {o.customerName}
                    <StatusBadge status={o.status} />
                  </span>
                  <span className={styles.rowMeta}>
                    {o.fulfillment === "pickup" ? "Pickup" : "Delivery"} {chip.day === "Today" || chip.day === "Tomorrow" ? chip.day.toLowerCase() : `${chip.day} ${chip.date}`}
                    , {o.deliverySlot}
                    {o.fulfillment === "delivery" && o.area ? ` · ${o.area}` : ""}
                    {o.fulfillment === "pickup" ? ` · ${o.pickupBranch === "dumas" ? "Dumas" : "Vesu"}` : ""}
                  </span>
                  <span className={styles.rowMeta}>
                    {formatPhone(o.customerPhone)} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                  </span>
                </span>
                <span className={styles.rowSide}>
                  <span className={styles.money}>
                    {formatPrice(o.total)}
                    {o.fulfillment === "delivery" && o.deliveryFee === null ? "+" : ""}
                  </span>
                  <PaymentBadge status={o.paymentStatus} method={o.paymentMethod} />
                </span>
              </Link>
            );
          })
        ) : (
          <p className={styles.empty}>{q ? `No orders match “${q}”.` : "No orders here."}</p>
        )}
      </div>
    </div>
  );
}
