import type { Metadata } from "next";
import CartView from "@/components/shop/CartView";
import ui from "@/components/shop/shop-ui.module.css";
import { formatPrice } from "@/lib/money";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Your cart — Shakha The Flower Shop",
  robots: { index: false },
};

// Reads the live delivery settings on every visit.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const settings = await getSettings();
  const deliveryNote =
    settings.deliveryFee === null
      ? "Confirmed by Shakha"
      : settings.deliveryFee === 0
        ? "Free"
        : settings.freeDeliveryAbove !== null
          ? `${formatPrice(settings.deliveryFee)}, free over ${formatPrice(settings.freeDeliveryAbove)}`
          : formatPrice(settings.deliveryFee);

  return (
    <div className={ui.page}>
      <div className="container">
        <header className={ui.head}>
          <span className="eyebrow">Your cart</span>
          <h1 className={`display ${ui.title}`}>Ready when you are.</h1>
        </header>
        <CartView
          acceptingOrders={settings.acceptingOrders}
          closedMessage={settings.closedMessage}
          deliveryNote={deliveryNote}
        />
      </div>
    </div>
  );
}
