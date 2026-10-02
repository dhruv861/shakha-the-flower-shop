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

type EnquiryLine = { name: string; variantName?: string; quantity: number; unitPrice: number };

/** "• 2 × Pink Rose Bouquet (Deluxe): ₹3,998" — the size is left out when there's only "Standard". */
function enquiryLine(line: EnquiryLine) {
  const size = line.variantName && line.variantName !== "Standard" ? ` (${line.variantName})` : "";
  return `• ${line.quantity} × ${line.name}${size}: ${formatPrice(line.unitPrice * line.quantity)}`;
}

/** "Ask about this on WhatsApp" on a product page: the size, quantity and add-ons chosen, and the page link. */
export function productEnquiry(item: EnquiryLine, addons: EnquiryLine[], pageUrl?: string) {
  const lines = [item, ...addons];
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  return [
    "Hi Shakha! I have a question about this:",
    "",
    ...lines.map(enquiryLine),
    ...(lines.length > 1 || item.quantity > 1 ? [`Total: ${formatPrice(total)}`] : []),
    ...(pageUrl ? ["", pageUrl] : []),
  ].join("\n");
}

/** "Ask about this on WhatsApp" in the cart: every line and the subtotal. */
export function cartEnquiry(lines: EnquiryLine[], subtotal: number) {
  return [
    "Hi Shakha! I have a question about my cart:",
    "",
    ...lines.map(enquiryLine),
    `Subtotal: ${formatPrice(subtotal)}`,
  ].join("\n");
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
