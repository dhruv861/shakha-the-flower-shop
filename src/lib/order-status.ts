import type { OrderStatus } from "@/db/schema";
import { formatLongDate } from "./delivery";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  preparing: "Being made",
  out_for_delivery: "Out for delivery",
  ready_for_pickup: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type Tone = "rose" | "blue" | "amber" | "green" | "muted";

export const STATUS_TONE: Record<OrderStatus, Tone> = {
  new: "rose",
  confirmed: "blue",
  preparing: "amber",
  out_for_delivery: "green",
  ready_for_pickup: "green",
  completed: "muted",
  cancelled: "muted",
};

/** The next step(s) the shop usually takes from each status. */
export function nextSteps(status: OrderStatus, fulfillment: "delivery" | "pickup") {
  switch (status) {
    case "new":
      return [{ status: "confirmed" as const, label: "Confirm order" }];
    case "confirmed":
      return [{ status: "preparing" as const, label: "Start making it" }];
    case "preparing":
      return fulfillment === "delivery"
        ? [{ status: "out_for_delivery" as const, label: "Send out for delivery" }]
        : [{ status: "ready_for_pickup" as const, label: "Mark ready for pickup" }];
    case "out_for_delivery":
      return [{ status: "completed" as const, label: "Mark delivered" }];
    case "ready_for_pickup":
      return [{ status: "completed" as const, label: "Mark collected" }];
    default:
      return [];
  }
}

type OrderForUpdate = {
  number: string;
  customerName: string;
  status: OrderStatus;
  fulfillment: "delivery" | "pickup";
  deliveryDate: string;
  deliverySlot: string;
  pickupBranch: string | null;
};

/** A ready-to-send WhatsApp update for the customer, for statuses worth telling them about. */
export function customerUpdate(order: OrderForUpdate) {
  const first = order.customerName.split(" ")[0];
  const when = `${formatLongDate(order.deliveryDate)}, ${order.deliverySlot}`;
  const studio = order.pickupBranch === "dumas" ? "Dumas" : "Vesu";
  switch (order.status) {
    case "new":
    case "confirmed":
      return `Hi ${first}, this is Shakha The Flower Shop. Your order ${order.number} is confirmed for ${when}. Thank you!`;
    case "preparing":
      return `Hi ${first}, our florists are making your order ${order.number} now.`;
    case "out_for_delivery":
      return `Hi ${first}, your Shakha order ${order.number} is on its way.`;
    case "ready_for_pickup":
      return `Hi ${first}, your order ${order.number} is ready to collect at our ${studio} studio.`;
    case "completed":
      return `Hi ${first}, thank you for ordering from Shakha! We hope they loved it.`;
    default:
      return `Hi ${first}, this is Shakha The Flower Shop about your order ${order.number}.`;
  }
}
