import type { Metadata } from "next";
import CheckoutForm from "@/components/shop/CheckoutForm";
import ui from "@/components/shop/shop-ui.module.css";
import { dateChip, deliveryDays, formatTime, indiaNow, slotLabel } from "@/lib/delivery";
import { deliveryRules, getSettings } from "@/lib/settings";
import { branches, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Checkout — Shakha The Flower Shop",
  robots: { index: false },
};

// Delivery times depend on the current time in India, so never prerender.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const settings = await getSettings();
  const now = indiaNow();
  const days = deliveryDays(deliveryRules(settings), now).map((d) => ({
    dateKey: d.dateKey,
    ...dateChip(d.dateKey, now.dateKey),
    slots: d.slots.map(slotLabel),
  }));

  return (
    <div className={ui.page}>
      <div className="container">
        <header className={ui.head}>
          <span className="eyebrow">Checkout</span>
          <h1 className={`display ${ui.title}`}>Almost there.</h1>
        </header>
        <CheckoutForm
          days={days}
          branches={branches.map((b) => ({
            id: b.id as "vesu" | "dumas",
            name: b.name,
            address: b.addressLine,
            hours: b.hours,
          }))}
          pickupEnabled={settings.pickupEnabled}
          upiEnabled={settings.upiId !== ""}
          acceptingOrders={settings.acceptingOrders}
          closedMessage={settings.closedMessage}
          cutoffNote={
            settings.sameDayCutoff ? `Same-day orders close at ${formatTime(settings.sameDayCutoff)}.` : null
          }
          whatsappHref={whatsappLink()}
        />
      </div>
    </div>
  );
}
