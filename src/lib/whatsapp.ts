import { formatLongDate } from "./delivery";
import { formatPrice } from "./money";

export function waLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** "9876543210" / "+91 98765 43210" → "919876543210" for wa.me links. */
export function waNumber(indianPhone: string) {
  const digits = indianPhone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

/** "+91 98765 43210" */
export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : phone;
}

type OrderForMessage = {
  number: string;
  fulfillment: "delivery" | "pickup";
  deliveryDate: string;
  deliverySlot: string;
  area: string | null;
  pickupBranch: string | null;
  total: number;
  deliveryFee: number | null;
};

type ItemForMessage = { productName: string; variantName: string; quantity: number };

/** What the customer sends Shakha after ordering, so the shop hears about it right away. */
export function orderMessage(order: OrderForMessage, items: ItemForMessage[], orderUrl: string) {
  const lines = items.map(
    (i) => `• ${i.quantity} × ${i.productName}${i.variantName !== "Standard" ? ` (${i.variantName})` : ""}`,
  );
  const when = `${formatLongDate(order.deliveryDate)}, ${order.deliverySlot}`;
  const where =
    order.fulfillment === "pickup"
      ? `Pickup from ${order.pickupBranch === "dumas" ? "Dumas" : "Vesu"}`
      : `Delivery${order.area ? ` to ${order.area}` : ""}`;
  const total = `${formatPrice(order.total)}${order.deliveryFee === null && order.fulfillment === "delivery" ? " + delivery" : ""}`;
  return [
    `Hi Shakha! I've placed order ${order.number} on your website.`,
    "",
    ...lines,
    "",
    `${where}: ${when}`,
    `Total: ${total}`,
    "",
    `Order details: ${orderUrl}`,
  ].join("\n");
}
