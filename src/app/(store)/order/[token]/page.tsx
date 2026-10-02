import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { WhatsAppIcon } from "@/components/Icons";
import ClearCart from "@/components/shop/ClearCart";
import ProductImage from "@/components/shop/ProductImage";
import ui from "@/components/shop/shop-ui.module.css";
import { formatLongDate } from "@/lib/delivery";
import { formatPrice } from "@/lib/money";
import { getOrderByToken } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { branches } from "@/lib/site";
import { formatPhone, orderMessage, waLink } from "@/lib/whatsapp";
import styles from "./order.module.css";

export const metadata: Metadata = {
  title: "Your order — Shakha The Flower Shop",
  robots: { index: false },
};

// Shows the order's live status every time it's opened.
export const dynamic = "force-dynamic";

const STEPS = {
  delivery: ["Placed", "Confirmed", "Being made", "Out for delivery", "Delivered"],
  pickup: ["Placed", "Confirmed", "Being made", "Ready for pickup", "Collected"],
};

const STEP_INDEX: Record<string, number> = {
  new: 0,
  confirmed: 1,
  preparing: 2,
  out_for_delivery: 3,
  ready_for_pickup: 3,
  completed: 4,
};

export default async function OrderPage({ params, searchParams }: PageProps<"/order/[token]">) {
  const { token } = await params;
  const placed = (await searchParams).placed === "1";
  const order = await getOrderByToken(token);
  if (!order) notFound();

  const settings = await getSettings();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const orderUrl = `${proto}://${host}/order/${order.token}`;
  const whatsappHref = waLink(settings.orderWhatsapp, orderMessage(order, order.items, orderUrl));

  const delivery = order.fulfillment === "delivery";
  const cancelled = order.status === "cancelled";
  const step = STEP_INDEX[order.status] ?? 0;
  const branch = branches.find((b) => b.id === order.pickupBranch);

  const showUpi = order.paymentMethod === "upi" && order.paymentStatus === "pending" && !cancelled && settings.upiId;
  const upiUrl = showUpi
    ? `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.upiName)}&am=${order.total}.00&cu=INR&tn=${encodeURIComponent(`Order ${order.number}`)}`
    : null;
  const qrSvg = upiUrl
    ? await QRCode.toString(upiUrl, { type: "svg", margin: 1, color: { dark: "#1d2a22", light: "#fbf7f1" } })
    : null;

  return (
    <div className={ui.page}>
      {placed && <ClearCart />}
      <div className={`container ${styles.layout}`}>
        <header className={ui.head}>
          <span className="eyebrow">Order {order.number}</span>
          <h1 className={`display ${ui.title}`}>
            {cancelled ? "This order was cancelled." : placed ? "Thank you. Your order is in." : "Your order"}
          </h1>
          {!cancelled && (
            <p className="lead">
              {delivery ? "Delivery" : "Pickup"} on {formatLongDate(order.deliveryDate)}, {order.deliverySlot}.
            </p>
          )}
        </header>

        {!cancelled && (
          <ol className={styles.steps} aria-label="Order progress">
            {STEPS[order.fulfillment].map((label, i) => (
              <li key={label} data-state={i < step ? "done" : i === step ? "current" : "todo"}>
                <span className={styles.dot} aria-hidden="true" />
                <span>{label}</span>
                {i === step && <span className="sr-only"> (current step)</span>}
              </li>
            ))}
          </ol>
        )}

        {!cancelled && order.status === "new" && (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Let us know on WhatsApp</h2>
            <p>
              Send us your order in one tap. It reaches the shop straight away, and we&apos;ll confirm it there.
            </p>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <WhatsAppIcon />
              Send order {order.number} on WhatsApp
            </a>
          </section>
        )}

        {upiUrl && qrSvg && (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Pay {formatPrice(order.total)} with UPI</h2>
            <p>
              Pay to <strong>{settings.upiId}</strong> from any UPI app. We&apos;ll mark it paid once it arrives.
            </p>
            <div className={styles.upi}>
              <a href={upiUrl} className="btn btn-outline">
                Open a UPI app
              </a>
              <div className={styles.qr} dangerouslySetInnerHTML={{ __html: qrSvg }} aria-label="UPI QR code" role="img" />
            </div>
            {order.deliveryFee === null && delivery && (
              <p className={styles.small}>The delivery charge is settled separately once we confirm it.</p>
            )}
          </section>
        )}

        <section className={styles.details} aria-label="Order details">
          <ul className={styles.items} role="list">
            {order.items.map((item) => (
              <li key={item.id} className={styles.item}>
                <span className={styles.thumb}>
                  <ProductImage image={item.image} alt="" sizes="64px" />
                </span>
                <span className={styles.itemName}>
                  {item.productName}
                  <span className={styles.meta}>
                    {item.quantity} × {formatPrice(item.unitPrice)}
                    {item.variantName !== "Standard" ? ` · ${item.variantName}` : ""}
                  </span>
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div>
              <dt>{delivery ? "Delivery" : "Pickup"}</dt>
              <dd>
                {!delivery ? "Free" : order.deliveryFee === null ? "Confirmed by Shakha" : order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}
              </dd>
            </div>
            <div className={styles.grand}>
              <dt>Total</dt>
              <dd>
                {formatPrice(order.total)}
                {delivery && order.deliveryFee === null ? " + delivery" : ""}
              </dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                {order.paymentStatus === "paid"
                  ? "Paid"
                  : order.paymentMethod === "upi"
                    ? "UPI (awaiting payment)"
                    : delivery
                      ? "Pay on delivery"
                      : "Pay at the studio"}
              </dd>
            </div>
          </dl>

          <div className={styles.facts}>
            {delivery ? (
              <div>
                <p className={styles.factTitle}>Delivering to</p>
                <p>
                  {order.recipientName}
                  {order.recipientPhone ? ` · ${formatPhone(order.recipientPhone)}` : ""}
                </p>
                <p>
                  {order.addressLine}
                  {order.area ? `, ${order.area}` : ""}
                  {order.pincode ? ` ${order.pincode}` : ""}
                </p>
                {order.landmark && <p>Near {order.landmark}</p>}
              </div>
            ) : (
              <div>
                <p className={styles.factTitle}>Pick up from</p>
                <p>{branch?.name}</p>
                <p>{branch?.addressLine}</p>
              </div>
            )}
            {order.giftMessage && (
              <div>
                <p className={styles.factTitle}>Card message</p>
                <p className={styles.gift}>“{order.giftMessage}”</p>
              </div>
            )}
          </div>
        </section>

        <p className={styles.small}>
          Keep this page&apos;s link to check on your order. Questions?{" "}
          <a href={waLink(settings.orderWhatsapp, `Hi Shakha! A question about order ${order.number}.`)} target="_blank" rel="noopener noreferrer">
            WhatsApp us
          </a>{" "}
          or <Link href="/shop">keep shopping</Link>.
        </p>
      </div>
    </div>
  );
}
