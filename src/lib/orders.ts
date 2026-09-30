import "server-only";
import { randomBytes } from "node:crypto";
import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, orderItems, orders, productImages, productVariants } from "@/db";
import { isValidDelivery, type IndiaNow, indiaNow } from "./delivery";
import { deliveryRules, type ShopSettings } from "./settings";

// ---------- Cart pricing ----------
// The browser's cart only says which sizes and how many. Names, prices and
// availability always come from the database, here.

export const cartSchema = z
  .array(
    z.object({
      variantId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(20),
    }),
  )
  .max(30);

export type CartInput = z.infer<typeof cartSchema>;

export type PricedLine = {
  variantId: number;
  productId: number;
  slug: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageKey: string | null;
  image: { key: string; widths: number[]; width: number; height: number; alt: string } | null;
};

export type CartIssue = { variantId: number; message: string };

export async function priceCart(input: CartInput) {
  // Merge repeated sizes into one line.
  const merged = new Map<number, number>();
  for (const line of input) merged.set(line.variantId, Math.min(20, (merged.get(line.variantId) ?? 0) + line.quantity));

  const ids = [...merged.keys()];
  const variants = ids.length
    ? await db.query.productVariants.findMany({
        where: inArray(productVariants.id, ids),
        with: {
          product: {
            with: { images: { orderBy: [asc(productImages.sortOrder), asc(productImages.id)], limit: 1 } },
          },
        },
      })
    : [];
  const byId = new Map(variants.map((v) => [v.id, v]));

  const lines: PricedLine[] = [];
  const issues: CartIssue[] = [];
  for (const [variantId, quantity] of merged) {
    const v = byId.get(variantId);
    if (!v || v.product.status !== "active" || v.price === null) {
      issues.push({ variantId, message: "This item is no longer available." });
      continue;
    }
    if (!v.product.inStock) {
      issues.push({ variantId, message: `${v.product.name} is sold out for today.` });
      continue;
    }
    const image = v.product.images[0];
    lines.push({
      variantId,
      productId: v.product.id,
      slug: v.product.slug,
      productName: v.product.name,
      variantName: v.name,
      unitPrice: v.price,
      quantity,
      lineTotal: v.price * quantity,
      imageKey: image?.key ?? null,
      image: image ? { key: image.key, widths: image.widths, width: image.width, height: image.height, alt: image.alt } : null,
    });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  return { lines, issues, subtotal };
}

/** 0 for pickup; null when the delivery charge isn't published yet. */
export function deliveryCharge(settings: ShopSettings, fulfillment: "delivery" | "pickup", subtotal: number) {
  if (fulfillment === "pickup") return 0;
  if (settings.freeDeliveryAbove !== null && subtotal >= settings.freeDeliveryAbove) return 0;
  return settings.deliveryFee;
}

// ---------- Checkout ----------

const text = (max: number) => z.string().trim().max(max);
const indianMobile = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s()-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"));

export const checkoutSchema = z
  .object({
    customerName: text(80).min(2, "Enter your name"),
    customerPhone: indianMobile,
    customerEmail: z.union([z.literal(""), z.email("Enter a valid email, or leave it blank")]),
    fulfillment: z.enum(["delivery", "pickup"]),
    pickupBranch: z.enum(["vesu", "dumas"]).optional(),
    sameRecipient: z.boolean(),
    recipientName: text(80),
    recipientPhone: z.union([z.literal(""), indianMobile]),
    addressLine: text(240),
    area: text(80),
    pincode: z.union([z.literal(""), z.string().regex(/^\d{6}$/, "Enter the 6-digit pincode")]),
    landmark: text(120),
    deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    deliverySlot: text(40).min(1, "Choose a time"),
    giftMessage: text(300),
    customerNote: text(500),
    paymentMethod: z.enum(["pay_on_delivery", "upi"]),
    cart: cartSchema.min(1, "Your cart is empty"),
  })
  .superRefine((d, ctx) => {
    if (d.fulfillment === "pickup") {
      if (!d.pickupBranch) ctx.addIssue({ code: "custom", path: ["pickupBranch"], message: "Choose a studio" });
      return;
    }
    if (d.addressLine.length < 8) ctx.addIssue({ code: "custom", path: ["addressLine"], message: "Enter the full address" });
    if (!d.pincode) ctx.addIssue({ code: "custom", path: ["pincode"], message: "Enter the 6-digit pincode" });
    if (!d.sameRecipient) {
      if (d.recipientName.length < 2)
        ctx.addIssue({ code: "custom", path: ["recipientName"], message: "Enter the recipient's name" });
      if (!d.recipientPhone)
        ctx.addIssue({ code: "custom", path: ["recipientPhone"], message: "Enter the recipient's mobile number" });
    }
  });

export type CheckoutData = z.infer<typeof checkoutSchema>;

export async function createOrder(data: CheckoutData, settings: ShopSettings, now: IndiaNow = indiaNow()) {
  if (!settings.acceptingOrders) return { ok: false as const, error: settings.closedMessage };
  if (data.fulfillment === "pickup" && !settings.pickupEnabled)
    return { ok: false as const, error: "Pickup isn't available right now. Please choose delivery." };
  if (data.paymentMethod === "upi" && !settings.upiId)
    return { ok: false as const, error: "UPI payment isn't available. Please choose pay on delivery." };
  if (!isValidDelivery(data.deliveryDate, data.deliverySlot, deliveryRules(settings), now))
    return { ok: false as const, error: "That delivery time has just closed. Please pick another." };

  const priced = await priceCart(data.cart);
  if (priced.issues.length || !priced.lines.length) {
    return {
      ok: false as const,
      error: priced.issues[0]?.message ?? "Your cart is empty.",
    };
  }

  const deliveryFee = deliveryCharge(settings, data.fulfillment, priced.subtotal);
  const total = priced.subtotal + (deliveryFee ?? 0);
  const token = randomBytes(16).toString("base64url");
  const delivery = data.fulfillment === "delivery";

  const number = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(orders)
      .values({
        number: `pending-${token}`,
        token,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || null,
        fulfillment: data.fulfillment,
        pickupBranch: delivery ? null : (data.pickupBranch ?? null),
        recipientName: delivery ? (data.sameRecipient ? data.customerName : data.recipientName) : null,
        recipientPhone: delivery ? (data.sameRecipient ? data.customerPhone : data.recipientPhone) : null,
        addressLine: delivery ? data.addressLine : null,
        area: delivery ? data.area || null : null,
        pincode: delivery ? data.pincode : null,
        landmark: delivery ? data.landmark || null : null,
        deliveryDate: data.deliveryDate,
        deliverySlot: data.deliverySlot,
        giftMessage: data.giftMessage,
        customerNote: data.customerNote,
        subtotal: priced.subtotal,
        deliveryFee,
        total,
      })
      .returning({ id: orders.id });
    const orderNumber = `SH${1000 + row.id}`;
    await tx.update(orders).set({ number: orderNumber }).where(eq(orders.id, row.id));
    await tx.insert(orderItems).values(
      priced.lines.map((l) => ({
        orderId: row.id,
        productId: l.productId,
        variantId: l.variantId,
        productName: l.productName,
        variantName: l.variantName,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
        imageKey: l.imageKey,
      })),
    );
    return orderNumber;
  });

  return { ok: true as const, token, number };
}

/** Order lines with their photo, if the product photo still exists. */
export async function withItemImages<T extends { imageKey: string | null }>(items: T[]) {
  const keys = [...new Set(items.map((i) => i.imageKey).filter((k): k is string => k !== null))];
  const images = keys.length ? await db.query.productImages.findMany({ where: inArray(productImages.key, keys) }) : [];
  const byKey = new Map(images.map((img) => [img.key, img]));
  return items.map((item) => {
    const img = item.imageKey ? byKey.get(item.imageKey) : undefined;
    return {
      ...item,
      image: img ? { key: img.key, widths: img.widths, width: img.width, height: img.height, alt: "" } : null,
    };
  });
}

export async function getOrderByToken(token: string) {
  if (!/^[\w-]{16,40}$/.test(token)) return null;
  const order = await db.query.orders.findFirst({
    where: eq(orders.token, token),
    with: { items: { orderBy: [asc(orderItems.id)] } },
  });
  if (!order) return null;
  return { ...order, items: await withItemImages(order.items) };
}
