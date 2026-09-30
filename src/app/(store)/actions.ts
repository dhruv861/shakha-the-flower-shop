"use server";

import { redirect } from "next/navigation";
import { cartSchema, checkoutSchema, createOrder, deliveryCharge, priceCart } from "@/lib/orders";
import { allow, clientIp } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";

/** Current names, prices and availability for the lines in a browser cart. */
export async function priceCartAction(input: unknown, fulfillment: "delivery" | "pickup" = "delivery") {
  const parsed = cartSchema.safeParse(input);
  if (!parsed.success) return { lines: [], issues: [], subtotal: 0, deliveryFee: null, total: 0 };
  const [settings, priced] = await Promise.all([getSettings(), priceCart(parsed.data)]);
  const deliveryFee = deliveryCharge(settings, fulfillment === "pickup" ? "pickup" : "delivery", priced.subtotal);
  return { ...priced, deliveryFee, total: priced.subtotal + (deliveryFee ?? 0) };
}

export type PricedCart = Awaited<ReturnType<typeof priceCartAction>>;

export type CheckoutState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

const TEXT_FIELDS = [
  "customerName",
  "customerPhone",
  "customerEmail",
  "fulfillment",
  "pickupBranch",
  "recipientName",
  "recipientPhone",
  "addressLine",
  "area",
  "pincode",
  "landmark",
  "deliveryDate",
  "deliverySlot",
  "giftMessage",
  "customerNote",
  "paymentMethod",
] as const;

export async function placeOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const values: Record<string, string> = {};
  for (const key of TEXT_FIELDS) {
    const value = formData.get(key);
    values[key] = typeof value === "string" ? value : "";
  }
  values.sameRecipient = formData.get("sameRecipient") === "on" ? "on" : "";

  if (!allow(`order:${await clientIp()}`, 12, 60 * 60 * 1000)) {
    return { error: "Too many orders from this connection. Please message us on WhatsApp instead.", values };
  }

  let cartInput: unknown = [];
  try {
    cartInput = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    // Treated as an empty cart below.
  }

  const parsed = checkoutSchema.safeParse({
    ...values,
    pickupBranch: values.pickupBranch || undefined,
    sameRecipient: values.sameRecipient === "on",
    cart: cartInput,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { error: fieldErrors.cart ?? "Please check the highlighted details.", fieldErrors, values };
  }

  const result = await createOrder(parsed.data, await getSettings());
  if (!result.ok) return { error: result.error, values };
  redirect(`/order/${result.token}?placed=1`);
}
