import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Prices are whole rupees. A null price means "not priced yet": such a size
// can't be ordered, and a product can't go live until one of its sizes has a price.

const createdAt = integer("created_at", { mode: "timestamp_ms" })
  .notNull()
  .default(sql`(unixepoch() * 1000)`);

const updatedAt = integer("updated_at", { mode: "timestamp_ms" })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)
  .$onUpdate(() => new Date());

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt,
  updatedAt,
});

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    occasions: text("occasions", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    // draft: only in admin · active: in the shop · archived: hidden, kept for order history
    status: text("status", { enum: PRODUCT_STATUSES }).notNull().default("draft"),
    // Quick "sold out today" switch that leaves the product listed.
    inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    // Offered as a gift add-on on product pages and in the cart.
    isAddon: integer("is_addon", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [index("products_category_idx").on(t.categoryId), index("products_status_idx").on(t.status)],
);

export const productVariants = sqliteTable(
  "product_variants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Standard"),
    price: integer("price"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const productImages = sqliteTable(
  "product_images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // Storage key: files live at <UPLOAD_DIR>/<key>-<width>.<avif|webp> (+ one .jpg),
    // or with Vercel Blob the key is the files' URL prefix (<blob url>/products/<id>).
    key: text("key").notNull(),
    widths: text("widths", { mode: "json" }).$type<number[]>().notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    alt: text("alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt,
  },
  (t) => [index("images_product_idx").on(t.productId)],
);

export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "ready_for_pickup",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["pay_on_delivery", "upi"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    number: text("number").notNull().unique(),
    // Unguessable id for the customer's order page link.
    token: text("token").notNull().unique(),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("new"),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }).notNull(),
    paymentStatus: text("payment_status", { enum: PAYMENT_STATUSES }).notNull().default("pending"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    fulfillment: text("fulfillment", { enum: ["delivery", "pickup"] }).notNull(),
    pickupBranch: text("pickup_branch"),
    recipientName: text("recipient_name"),
    recipientPhone: text("recipient_phone"),
    addressLine: text("address_line"),
    area: text("area"),
    pincode: text("pincode"),
    landmark: text("landmark"),
    // Delivery or pickup date (YYYY-MM-DD, India time) and the chosen slot's label.
    deliveryDate: text("delivery_date").notNull(),
    deliverySlot: text("delivery_slot").notNull(),
    giftMessage: text("gift_message").notNull().default(""),
    customerNote: text("customer_note").notNull().default(""),
    adminNote: text("admin_note").notNull().default(""),
    subtotal: integer("subtotal").notNull(),
    // Null while the delivery charge is "confirmed by Shakha" (no fee set in settings).
    deliveryFee: integer("delivery_fee"),
    total: integer("total").notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
    index("orders_delivery_date_idx").on(t.deliveryDate),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // Snapshots, so the order still reads correctly after a product changes or is deleted.
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    variantName: text("variant_name").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
    imageKey: text("image_key"),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
  createdAt,
});

export const sessions = sqliteTable(
  "sessions",
  {
    // SHA-256 of the cookie token, so a leaked database can't be replayed as logins.
    id: text("id").primaryKey(),
    adminId: integer("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt,
  },
  (t) => [index("sessions_admin_idx").on(t.adminId)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
  updatedAt,
});

// ---------- Relations (for db.query.* lookups) ----------

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variants: many(productVariants),
  images: many(productImages),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));
