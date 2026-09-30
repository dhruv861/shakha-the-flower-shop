import "server-only";
import { and, asc, count, desc, eq, gte, inArray, like, notInArray, or, sql, sum } from "drizzle-orm";
import {
  admins,
  categories,
  db,
  type OrderStatus,
  orderItems,
  orders,
  productImages,
  products,
  productVariants,
} from "@/db";
import { addDays, indiaNow } from "./delivery";
import { toStoredImage } from "./catalog";
import { withItemImages } from "./orders";

// Reads for the admin panel. Every page calls requireAdmin() before these.

const OPEN: OrderStatus[] = ["new", "confirmed", "preparing", "out_for_delivery", "ready_for_pickup"];

export const ORDER_VIEWS = {
  active: "Open",
  new: "New",
  today: "Today",
  completed: "Completed",
  cancelled: "Cancelled",
  all: "All",
} as const;
export type OrderView = keyof typeof ORDER_VIEWS;

export async function newOrderCount() {
  const [row] = await db.select({ n: count() }).from(orders).where(eq(orders.status, "new"));
  return row?.n ?? 0;
}

export async function listOrders(view: OrderView, q = "") {
  const today = indiaNow().dateKey;
  const filters = [];
  if (view === "active") filters.push(inArray(orders.status, OPEN));
  if (view === "new") filters.push(eq(orders.status, "new"));
  if (view === "today") filters.push(and(eq(orders.deliveryDate, today), notInArray(orders.status, ["cancelled"])));
  if (view === "completed") filters.push(eq(orders.status, "completed"));
  if (view === "cancelled") filters.push(eq(orders.status, "cancelled"));
  const term = q.trim();
  if (term) {
    const pattern = `%${term.replace(/[%_]/g, "")}%`;
    filters.push(
      or(like(orders.number, pattern), like(orders.customerName, pattern), like(orders.customerPhone, pattern), like(orders.recipientName, pattern)),
    );
  }
  const rows = await db
    .select({
      id: orders.id,
      number: orders.number,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      customerName: orders.customerName,
      customerPhone: orders.customerPhone,
      fulfillment: orders.fulfillment,
      area: orders.area,
      pickupBranch: orders.pickupBranch,
      deliveryDate: orders.deliveryDate,
      deliverySlot: orders.deliverySlot,
      total: orders.total,
      deliveryFee: orders.deliveryFee,
      createdAt: orders.createdAt,
      itemCount: sql<number>`(select coalesce(sum(${orderItems.quantity}), 0) from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
    })
    .from(orders)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(view === "active" || view === "today" ? asc(orders.deliveryDate) : desc(orders.createdAt), desc(orders.id))
    .limit(200);
  return rows;
}

export type OrderRow = Awaited<ReturnType<typeof listOrders>>[number];

export async function getOrder(id: number) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: { orderBy: [asc(orderItems.id)] } },
  });
  if (!order) return null;
  return { ...order, items: await withItemImages(order.items) };
}

export async function dashboardData() {
  const now = indiaNow();
  const tomorrow = addDays(now.dateKey, 1);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [statusRows, upcoming, recent, productRows, [sales]] = await Promise.all([
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db
      .select()
      .from(orders)
      .where(and(inArray(orders.deliveryDate, [now.dateKey, tomorrow]), inArray(orders.status, OPEN)))
      .orderBy(asc(orders.deliveryDate), asc(orders.deliverySlot))
      .limit(30),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
    db.query.products.findMany({ columns: { id: true, status: true, isAddon: true }, with: { variants: { columns: { price: true } } } }),
    db
      .select({ total: sum(orders.total), n: count() })
      .from(orders)
      .where(and(gte(orders.createdAt, weekAgo), notInArray(orders.status, ["cancelled"]))),
  ]);

  const byStatus = Object.fromEntries(statusRows.map((r) => [r.status, r.n])) as Partial<Record<OrderStatus, number>>;
  const live = productRows.filter((p) => p.status === "active").length;
  const unpriced = productRows.filter((p) => p.status !== "archived" && p.variants.every((v) => v.price === null)).length;

  return {
    today: now.dateKey,
    tomorrow,
    byStatus,
    upcoming,
    recent,
    products: { total: productRows.length, live, unpriced },
    weekSales: Number(sales?.total ?? 0),
    weekOrders: sales?.n ?? 0,
  };
}

export async function listProductsAdmin(filter: { status?: string; category?: number; q?: string }) {
  const rows = await db.query.products.findMany({
    with: {
      category: true,
      variants: { orderBy: [asc(productVariants.sortOrder)] },
      images: { orderBy: [asc(productImages.sortOrder), asc(productImages.id)], limit: 1 },
    },
    orderBy: [asc(products.sortOrder), asc(products.name)],
  });
  const q = filter.q?.trim().toLowerCase() ?? "";
  return rows
    .filter((p) => (filter.status ? p.status === filter.status : p.status !== "archived"))
    .filter((p) => (filter.category ? p.categoryId === filter.category : true))
    .filter((p) => (q ? p.name.toLowerCase().includes(q) || p.slug.includes(q) : true))
    .map((p) => {
      const prices = p.variants.map((v) => v.price).filter((x): x is number => x !== null);
      return {
        ...p,
        image: p.images[0] ? toStoredImage(p.images[0]) : null,
        minPrice: prices.length ? Math.min(...prices) : null,
        maxPrice: prices.length ? Math.max(...prices) : null,
        unpriced: prices.length === 0,
      };
    });
}

export async function getProductAdmin(id: number) {
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: { orderBy: [asc(productVariants.sortOrder), asc(productVariants.id)] },
      images: { orderBy: [asc(productImages.sortOrder), asc(productImages.id)] },
    },
  });
  return product ?? null;
}

export async function listCategoriesAdmin() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      sortOrder: categories.sortOrder,
      productCount: sql<number>`(select count(*) from ${products} where ${products.categoryId} = ${categories.id})`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return rows;
}

export async function listAdmins() {
  return db
    .select({ id: admins.id, email: admins.email, name: admins.name, lastLoginAt: admins.lastLoginAt })
    .from(admins)
    .orderBy(asc(admins.createdAt));
}
