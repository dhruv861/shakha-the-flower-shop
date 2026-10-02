"use server";

import { and, asc, eq, max, ne, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  admins,
  categories,
  db,
  ORDER_STATUSES,
  orders,
  PAYMENT_STATUSES,
  PRODUCT_STATUSES,
  productImages,
  products,
  productVariants,
  sessions,
} from "@/db";
import { createSession, endSession, requireAdmin } from "@/lib/auth";
import { deleteImageFiles, ImageError, storeImage } from "@/lib/image-store";
import { OCCASIONS } from "@/lib/occasions";
import { generatePassword, hashPassword, verifyPassword } from "@/lib/password";
import { allow, clientIp } from "@/lib/rate-limit";
import { saveSettings, shopSettingsSchema } from "@/lib/settings";
import { slugify } from "@/lib/slug";

// Every action here starts with requireAdmin(): Server Actions can be called
// with a direct POST, so the admin layout alone protects nothing.

export type FormState = { ok?: boolean; message?: string; error?: string; fieldErrors?: Record<string, string> };

/** Storefront pages are prerendered; refresh them after any catalog or settings change. */
function refreshStore() {
  revalidatePath("/", "layout");
}

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};

function firstErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[issue.path.map(String).join(".") || "form"] ??= issue.message;
  return out;
}

// ---------- Sign in / out ----------

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!allow(`login:${await clientIp()}`, 10, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Wait 15 minutes and try again." };
  }
  const admin = email ? await db.query.admins.findFirst({ where: eq(admins.email, email) }) : undefined;
  // Hash even for unknown emails, so response time doesn't reveal which emails exist.
  const valid = admin ? await verifyPassword(password, admin.passwordHash) : (await hashPassword(password), false);
  if (!admin || !valid) return { error: "That email and password don't match." };
  await createSession(admin.id);
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

// ---------- Orders ----------

export async function setOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = z.enum(ORDER_STATUSES).safeParse(formData.get("status"));
  if (!Number.isInteger(id) || !status.success) return;
  await db.update(orders).set({ status: status.data }).where(eq(orders.id, id));
  revalidatePath("/admin", "layout");
}

export async function setPaymentStatusAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = z.enum(PAYMENT_STATUSES).safeParse(formData.get("paymentStatus"));
  if (!Number.isInteger(id) || !status.success) return;
  await db.update(orders).set({ paymentStatus: status.data }).where(eq(orders.id, id));
  revalidatePath("/admin", "layout");
}

export async function saveOrderNoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const note = str(formData, "adminNote").slice(0, 2000);
  if (!Number.isInteger(id)) return { error: "Unknown order." };
  await db.update(orders).set({ adminNote: note }).where(eq(orders.id, id));
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: "Note saved." };
}

// ---------- Products ----------

const priceField = z
  .string()
  .trim()
  .transform((s) => s.replace(/[₹,\s]/g, ""))
  .pipe(z.union([z.literal(""), z.string().regex(/^\d{1,7}$/, "Whole rupees only, e.g. 1299")]))
  .transform((s) => (s === "" ? null : Number(s)));

const productSchema = z.object({
  name: z.string().trim().min(2, "Give it a name").max(80),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only"),
  categoryId: z.number().int().positive().nullable(),
  summary: z.string().trim().max(200),
  description: z.string().trim().max(4000),
  occasions: z.array(z.enum(OCCASIONS.map((o) => o.slug) as [string, ...string[]])),
  status: z.enum(PRODUCT_STATUSES),
  inStock: z.boolean(),
  featured: z.boolean(),
  isAddon: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  variants: z
    .array(
      z.object({
        id: z.number().int().positive().nullable(),
        name: z.string().trim().min(1, "Name each size").max(40),
        price: priceField,
      }),
    )
    .min(1, "Add at least one size")
    .max(12),
});

export async function saveProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id")) || null;
  const ids = formData.getAll("variantId").map(String);
  const names = formData.getAll("variantName").map(String);
  const prices = formData.getAll("variantPrice").map(String);
  const name = str(formData, "name");

  const parsed = productSchema.safeParse({
    name,
    slug: str(formData, "slug") || slugify(name),
    categoryId: Number(formData.get("categoryId")) || null,
    summary: str(formData, "summary"),
    description: str(formData, "description"),
    occasions: formData.getAll("occasions").map(String),
    status: formData.get("status"),
    inStock: formData.get("inStock") === "on",
    featured: formData.get("featured") === "on",
    isAddon: formData.get("isAddon") === "on",
    sortOrder: Number(formData.get("sortOrder") || 0),
    variants: names.map((n, i) => ({ id: Number(ids[i]) || null, name: n, price: prices[i] ?? "" })),
  });
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: firstErrors(parsed.error) };
  const data = parsed.data;

  if (data.status === "active" && data.variants.every((v) => v.price === null)) {
    return {
      error: "Add a price to at least one size before making this product live.",
      fieldErrors: { "variants.0.price": "Needed to go live" },
    };
  }
  const clash = await db.query.products.findFirst({
    where: id ? and(eq(products.slug, data.slug), ne(products.id, id)) : eq(products.slug, data.slug),
  });
  if (clash) return { error: "Another product already uses that web address.", fieldErrors: { slug: "Already in use" } };

  const values = {
    name: data.name,
    slug: data.slug,
    categoryId: data.categoryId,
    summary: data.summary,
    description: data.description,
    occasions: data.occasions,
    status: data.status,
    inStock: data.inStock,
    featured: data.featured,
    isAddon: data.isAddon,
    sortOrder: data.sortOrder,
  };

  const productId = await db.transaction(async (tx) => {
    let pid = id;
    if (pid) {
      await tx.update(products).set(values).where(eq(products.id, pid));
    } else {
      const [row] = await tx.insert(products).values(values).returning({ id: products.id });
      pid = row.id;
    }
    const keep = data.variants.map((v) => v.id).filter((v): v is number => v !== null);
    await tx
      .delete(productVariants)
      .where(
        keep.length
          ? and(eq(productVariants.productId, pid), notInArray(productVariants.id, keep))
          : eq(productVariants.productId, pid),
      );
    for (const [i, v] of data.variants.entries()) {
      if (v.id) {
        await tx
          .update(productVariants)
          .set({ name: v.name, price: v.price, sortOrder: i })
          .where(and(eq(productVariants.id, v.id), eq(productVariants.productId, pid)));
      } else {
        await tx.insert(productVariants).values({ productId: pid, name: v.name, price: v.price, sortOrder: i });
      }
    }
    return pid;
  });

  refreshStore();
  // Reload the editor so new sizes pick up their database ids.
  redirect(`/admin/products/${productId}?${id ? "saved" : "created"}=1`);
}

export async function quickProductAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const field = formData.get("field");
  const product = Number.isInteger(id) ? await db.query.products.findFirst({ where: eq(products.id, id), with: { variants: true } }) : null;
  if (!product) return;
  if (field === "inStock") {
    await db.update(products).set({ inStock: !product.inStock }).where(eq(products.id, id));
  } else if (field === "status") {
    const next = product.status === "active" ? "draft" : "active";
    // A product can't go live without a price (the edit page explains why).
    if (next === "active" && product.variants.every((v) => v.price === null)) return;
    await db.update(products).set({ status: next }).where(eq(products.id, id));
  }
  refreshStore();
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const images = await db.select({ key: productImages.key }).from(productImages).where(eq(productImages.productId, id));
  // Past orders keep their own copy of the name and price, so this is safe.
  await db.delete(products).where(eq(products.id, id));
  await Promise.all(images.map((img) => deleteImageFiles(img.key)));
  refreshStore();
  redirect("/admin/products");
}

export async function uploadImagesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const productId = Number(formData.get("productId"));
  const product = Number.isInteger(productId) ? await db.query.products.findFirst({ where: eq(products.id, productId) }) : null;
  if (!product) return { error: "Unknown product." };

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choose one or more photos first." };
  if (files.length > 8) return { error: "Upload up to 8 photos at a time." };

  const [{ top }] = await db
    .select({ top: max(productImages.sortOrder) })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  let order = (top ?? -1) + 1;
  const problems: string[] = [];
  for (const file of files) {
    try {
      const stored = await storeImage(Buffer.from(await file.arrayBuffer()));
      await db.insert(productImages).values({ productId, ...stored, alt: product.name, sortOrder: order++ });
    } catch (error) {
      problems.push(`${file.name}: ${error instanceof ImageError ? error.message : "couldn't be saved"}`);
    }
  }
  refreshStore();
  const added = files.length - problems.length;
  if (problems.length) return { error: problems.join(" "), message: added ? `Added ${added} photo${added === 1 ? "" : "s"}.` : undefined };
  return { ok: true, message: `Added ${added} photo${added === 1 ? "" : "s"}.` };
}

export async function imageAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("imageId"));
  const op = formData.get("op");
  const image = Number.isInteger(id) ? await db.query.productImages.findFirst({ where: eq(productImages.id, id) }) : null;
  if (!image) return;

  if (op === "alt") {
    await db.update(productImages).set({ alt: str(formData, "alt").slice(0, 200) }).where(eq(productImages.id, id));
  } else if (op === "delete") {
    await db.delete(productImages).where(eq(productImages.id, id));
    await deleteImageFiles(image.key);
  } else if (op === "left" || op === "right" || op === "cover") {
    const all = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, image.productId))
      .orderBy(asc(productImages.sortOrder), asc(productImages.id));
    const from = all.findIndex((i) => i.id === id);
    const to = op === "cover" ? 0 : op === "left" ? Math.max(0, from - 1) : Math.min(all.length - 1, from + 1);
    const [moved] = all.splice(from, 1);
    all.splice(to, 0, moved);
    await Promise.all(all.map((img, i) => db.update(productImages).set({ sortOrder: i }).where(eq(productImages.id, img.id))));
  }
  refreshStore();
}

// ---------- Categories ----------

const categorySchema = z.object({
  name: z.string().trim().min(2, "Give it a name").max(60),
  slug: z.string().trim().max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only"),
  description: z.string().trim().max(300),
  sortOrder: z.number().int().min(0).max(999),
});

export async function saveCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id")) || null;
  const name = str(formData, "name");
  const parsed = categorySchema.safeParse({
    name,
    slug: str(formData, "slug") || slugify(name),
    description: str(formData, "description"),
    sortOrder: Number(formData.get("sortOrder") || 0),
  });
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: firstErrors(parsed.error) };
  const clash = await db.query.categories.findFirst({
    where: id ? and(eq(categories.slug, parsed.data.slug), ne(categories.id, id)) : eq(categories.slug, parsed.data.slug),
  });
  if (clash) return { error: "Another category already uses that web address.", fieldErrors: { slug: "Already in use" } };
  if (id) await db.update(categories).set(parsed.data).where(eq(categories.id, id));
  else await db.insert(categories).values(parsed.data);
  refreshStore();
  return { ok: true, message: id ? "Category saved." : "Category added." };
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  // Products in it stay, just without a category.
  await db.delete(categories).where(eq(categories.id, id));
  refreshStore();
}

// ---------- Settings ----------

const rupeesOrNull = (v: string) => {
  const clean = v.replace(/[₹,\s]/g, "");
  return clean === "" ? null : Number(clean);
};

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const starts = formData.getAll("slotStart").map(String);
  const ends = formData.getAll("slotEnd").map(String);
  const parsed = shopSettingsSchema.safeParse({
    acceptingOrders: formData.get("acceptingOrders") === "on",
    closedMessage: str(formData, "closedMessage"),
    sameDayCutoff: str(formData, "sameDayCutoff"),
    leadTimeMinutes: Number(formData.get("leadTimeMinutes") || 0),
    slots: starts.map((start, i) => ({ start, end: ends[i] ?? "" })).filter((s) => s.start || s.end),
    daysAhead: Number(formData.get("daysAhead") || 0),
    deliveryFee: rupeesOrNull(str(formData, "deliveryFee")),
    freeDeliveryAbove: rupeesOrNull(str(formData, "freeDeliveryAbove")),
    pickupEnabled: formData.get("pickupEnabled") === "on",
    upiId: str(formData, "upiId"),
    upiName: str(formData, "upiName"),
    orderWhatsapp: str(formData, "orderWhatsapp").replace(/\D/g, ""),
  });
  if (!parsed.success) return { error: "Please fix the highlighted settings.", fieldErrors: firstErrors(parsed.error) };
  await saveSettings(parsed.data);
  refreshStore();
  return { ok: true, message: "Settings saved. The shop is updated." };
}

// ---------- Account ----------

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 10) return { error: "Use at least 10 characters.", fieldErrors: { next: "At least 10 characters" } };
  if (next !== String(formData.get("confirm") ?? "")) return { error: "The new passwords don't match.", fieldErrors: { confirm: "Doesn't match" } };
  const admin = await db.query.admins.findFirst({ where: eq(admins.id, me.id) });
  if (!admin || !(await verifyPassword(current, admin.passwordHash))) {
    return { error: "Your current password is wrong.", fieldErrors: { current: "Wrong password" } };
  }
  await db.update(admins).set({ passwordHash: await hashPassword(next) }).where(eq(admins.id, me.id));
  // Sign out everywhere else; this browser signs in again with the new password.
  await db.delete(sessions).where(eq(sessions.adminId, me.id));
  await createSession(me.id);
  return { ok: true, message: "Password changed. Other devices were signed out." };
}

export async function addAdminAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const email = str(formData, "email").toLowerCase();
  const name = str(formData, "name");
  if (!z.email().safeParse(email).success) return { error: "Enter a valid email.", fieldErrors: { email: "Invalid email" } };
  if (await db.query.admins.findFirst({ where: eq(admins.email, email) })) {
    return { error: "That email already has an admin login.", fieldErrors: { email: "Already an admin" } };
  }
  const password = generatePassword();
  await db.insert(admins).values({ email, name: name || email.split("@")[0], passwordHash: await hashPassword(password) });
  revalidatePath("/admin/account");
  return {
    ok: true,
    message: `Added ${email}. Their temporary password is ${password} — share it privately; they can change it under Account.`,
  };
}

export async function removeAdminAction(formData: FormData) {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id === me.id) return;
  await db.delete(admins).where(eq(admins.id, id));
  revalidatePath("/admin/account");
}

export async function signOutEverywhereAction() {
  const me = await requireAdmin();
  await db.delete(sessions).where(eq(sessions.adminId, me.id));
  await endSession();
  redirect("/admin/login");
}
