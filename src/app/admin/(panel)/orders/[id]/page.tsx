import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentBadge, StatusBadge } from "@/components/admin/Badges";
import OrderNoteForm from "@/components/admin/OrderNoteForm";
import PrintButton from "@/components/admin/PrintButton";
import SubmitButton from "@/components/admin/SubmitButton";
import styles from "@/components/admin/admin.module.css";
import ProductImage from "@/components/shop/ProductImage";
import { ORDER_STATUSES } from "@/db/schema";
import { getOrder } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { formatLongDate } from "@/lib/delivery";
import { formatPrice } from "@/lib/money";
import { customerUpdate, nextSteps, STATUS_LABEL } from "@/lib/order-status";
import { branches } from "@/lib/site";
import { formatPhone, waLink, waNumber } from "@/lib/whatsapp";
import { setOrderStatusAction, setPaymentStatusAction } from "../../../actions";
import page from "./order.module.css";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[id]">): Promise<Metadata> {
  return { title: `Order ${(await params).id}` };
}

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const order = await getOrder(Number((await params).id));
  if (!order) notFound();

  const delivery = order.fulfillment === "delivery";
  const steps = nextSteps(order.status, order.fulfillment);
  const branch = branches.find((b) => b.id === order.pickupBranch);
  const fullAddress = [order.addressLine, order.area, order.pincode, "Surat"].filter(Boolean).join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const updateHref = waLink(waNumber(order.customerPhone), customerUpdate(order));
  const placed = order.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  return (
    <div className={page.wrap}>
      <Link href="/admin/orders" className={`${styles.back} ${styles.noPrint}`}>
        ← All orders
      </Link>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Order {order.number}</h1>
          <p className={styles.pageSub}>Placed {placed}</p>
        </div>
        <div className={styles.buttons}>
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
          <PrintButton className={`btn btn-outline ${styles.small} ${styles.noPrint}`} />
        </div>
      </div>

      <div className={styles.cols}>
        <div className={styles.stack}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              {delivery ? "Delivery" : "Pickup"} · {formatLongDate(order.deliveryDate)}, {order.deliverySlot}
            </h2>
            {delivery ? (
              <div className={page.facts}>
                <p>
                  <strong>{order.recipientName}</strong>
                  {order.recipientPhone && (
                    <>
                      {" · "}
                      <a href={`tel:+91${order.recipientPhone}`}>{formatPhone(order.recipientPhone)}</a>
                    </>
                  )}
                </p>
                <p>{fullAddress}</p>
                {order.landmark && <p>Near {order.landmark}</p>}
                <p className={styles.noPrint}>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    Open in Google Maps
                  </a>
                </p>
              </div>
            ) : (
              <div className={page.facts}>
                <p>
                  <strong>{branch?.name ?? "Studio"}</strong> studio
                </p>
                <p>{branch?.addressLine}</p>
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Items</h2>
            <ul className={page.items} role="list">
              {order.items.map((item) => (
                <li key={item.id} className={page.item}>
                  <span className={styles.thumb}>
                    <ProductImage image={item.image} alt="" sizes="48px" />
                  </span>
                  <span className={page.itemName}>
                    <strong>
                      {item.quantity} × {item.productName}
                    </strong>
                    <span className={styles.rowMeta}>
                      {item.variantName !== "Standard" ? `${item.variantName} · ` : ""}
                      {formatPrice(item.unitPrice)} each
                    </span>
                  </span>
                  <span className={styles.money}>{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className={page.totals}>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div>
                <dt>{delivery ? "Delivery" : "Pickup"}</dt>
                <dd>
                  {!delivery ? "—" : order.deliveryFee === null ? "Not set — agree it with the customer" : order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}
                </dd>
              </div>
              <div className={page.grand}>
                <dt>Total</dt>
                <dd>
                  {formatPrice(order.total)}
                  {delivery && order.deliveryFee === null ? " + delivery" : ""}
                </dd>
              </div>
            </dl>
          </section>

          {(order.giftMessage || order.customerNote) && (
            <section className={styles.card}>
              {order.giftMessage && (
                <>
                  <h2 className={styles.cardTitle}>Card message</h2>
                  <p className={page.gift}>{order.giftMessage}</p>
                </>
              )}
              {order.customerNote && (
                <>
                  <h2 className={styles.cardTitle} style={{ marginTop: order.giftMessage ? 18 : 0 }}>
                    Note from the customer
                  </h2>
                  <p>{order.customerNote}</p>
                </>
              )}
            </section>
          )}
        </div>

        <div className={`${styles.stack} ${styles.noPrint}`}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Next step</h2>
            <div className={styles.stack}>
              {steps.length > 0 && (
                <form action={setOrderStatusAction} className={styles.buttons}>
                  <input type="hidden" name="id" value={order.id} />
                  {steps.map((s) => (
                    <SubmitButton key={s.status} name="status" value={s.status} pendingLabel="Updating…">
                      {s.label}
                    </SubmitButton>
                  ))}
                </form>
              )}
              <a href={updateHref} target="_blank" rel="noopener noreferrer" className={`btn btn-outline ${styles.small}`}>
                WhatsApp the customer an update
              </a>
              <form action={setOrderStatusAction} className={styles.toolbar} style={{ marginBottom: 0 }}>
                <input type="hidden" name="id" value={order.id} />
                {/* Keyed so it re-mounts on the current status: an uncontrolled select ignores later defaultValue changes. */}
                <select key={order.status} name="status" defaultValue={order.status} className={styles.select} aria-label="Set status">
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <SubmitButton className={`btn btn-outline ${styles.small}`} pendingLabel="…">
                  Set status
                </SubmitButton>
              </form>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Payment</h2>
            <p className={styles.rowMeta} style={{ marginBottom: 12 }}>
              {order.paymentMethod === "upi" ? "Customer chose to pay by UPI after ordering." : "Customer pays on delivery or at pickup."}
            </p>
            <form action={setPaymentStatusAction} className={styles.buttons}>
              <input type="hidden" name="id" value={order.id} />
              {order.paymentStatus !== "paid" && (
                <SubmitButton name="paymentStatus" value="paid" className={`btn btn-primary ${styles.small}`}>
                  Mark as paid
                </SubmitButton>
              )}
              {order.paymentStatus === "paid" && (
                <>
                  <SubmitButton name="paymentStatus" value="pending" className={`btn btn-outline ${styles.small}`}>
                    Mark unpaid
                  </SubmitButton>
                  <SubmitButton name="paymentStatus" value="refunded" className={`btn btn-outline ${styles.small}`}>
                    Mark refunded
                  </SubmitButton>
                </>
              )}
            </form>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Customer</h2>
            <div className={page.facts}>
              <p>
                <strong>{order.customerName}</strong>
              </p>
              <p>
                <a href={`tel:+91${order.customerPhone}`}>{formatPhone(order.customerPhone)}</a>
                {" · "}
                <a href={waLink(waNumber(order.customerPhone), "")} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </p>
              {order.customerEmail && (
                <p>
                  <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a>
                </p>
              )}
            </div>
          </section>

          <section className={styles.card}>
            <OrderNoteForm id={order.id} note={order.adminNote} />
          </section>
        </div>
      </div>
    </div>
  );
}
