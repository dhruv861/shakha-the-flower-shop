import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { db, settings as settingsTable } from "@/db";
import type { DeliveryRules } from "./delivery";
import { site } from "./site";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, like 16:30");

export const slotSchema = z
  .object({ start: time, end: time })
  .refine((s) => s.start < s.end, "A slot has to end after it starts");

export const shopSettingsSchema = z.object({
  acceptingOrders: z.boolean(),
  closedMessage: z.string().trim().max(300),
  sameDayCutoff: z.union([z.literal(""), time]),
  leadTimeMinutes: z.number().int().min(0).max(720),
  slots: z.array(slotSchema).min(1, "Add at least one time slot").max(12),
  daysAhead: z.number().int().min(0).max(60),
  // null: the charge isn't published and Shakha confirms it with the customer.
  deliveryFee: z.number().int().min(0).max(100000).nullable(),
  freeDeliveryAbove: z.number().int().min(0).max(1000000).nullable(),
  pickupEnabled: z.boolean(),
  upiId: z
    .string()
    .trim()
    .max(100)
    .refine((v) => v === "" || /^[\w.-]+@[\w.-]+$/.test(v), "That doesn't look like a UPI ID (name@bank)"),
  upiName: z.string().trim().max(100),
  orderWhatsapp: z.string().regex(/^\d{10,15}$/, "Digits only, with country code (91…)"),
});

export type ShopSettings = z.infer<typeof shopSettingsSchema>;

// Neutral starting values. Nothing here promises a fee, a cut-off or a slot
// that Shakha hasn't set: the delivery window is simply the shops' opening hours.
export const DEFAULT_SETTINGS: ShopSettings = {
  acceptingOrders: true,
  closedMessage: "We're not taking online orders right now. Message us on WhatsApp and we'll help.",
  sameDayCutoff: "",
  leadTimeMinutes: 90,
  slots: [{ start: "08:00", end: "22:00" }],
  daysAhead: 14,
  deliveryFee: null,
  freeDeliveryAbove: null,
  pickupEnabled: true,
  upiId: "",
  upiName: site.name,
  orderWhatsapp: site.whatsappNumber,
};

const KEY = "shop";

export const getSettings = cache(async (): Promise<ShopSettings> => {
  const row = await db.query.settings.findFirst({ where: eq(settingsTable.key, KEY) });
  const merged = { ...DEFAULT_SETTINGS, ...((row?.value as Partial<ShopSettings> | undefined) ?? {}) };
  const parsed = shopSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
});

export async function saveSettings(next: ShopSettings) {
  await db
    .insert(settingsTable)
    .values({ key: KEY, value: next })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: next, updatedAt: new Date() } });
}

export function deliveryRules(s: ShopSettings): DeliveryRules {
  return {
    sameDayCutoff: s.sameDayCutoff,
    leadTimeMinutes: s.leadTimeMinutes,
    slots: s.slots,
    daysAhead: s.daysAhead,
  };
}
