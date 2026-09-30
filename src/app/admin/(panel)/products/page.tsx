import type { Metadata } from "next";
import Link from "next/link";
import SubmitButton from "@/components/admin/SubmitButton";
import styles from "@/components/admin/admin.module.css";
import ProductImage from "@/components/shop/ProductImage";
import { listCategoriesAdmin, listProductsAdmin } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { quickProductAction } from "../../actions";

export const metadata: Metadata = { title: "Products" };

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "active", label: "Live" },
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const category = Number(params.category) || undefined;
  const q = typeof params.q === "string" ? params.q.slice(0, 60) : "";
  const [products, categories] = await Promise.all([
    listProductsAdmin({ status: status || undefined, category, q }),
    listCategoriesAdmin(),
  ]);
  const unpricedLive = products.filter((p) => p.unpriced && p.status !== "archived").length;

  const href = (next: Record<string, string>) => {
    const sp = new URLSearchParams({ ...(status && { status }), ...(category && { category: String(category) }), ...(q && { q }), ...next });
    for (const [k, v] of [...sp]) if (!v) sp.delete(k);
    const s = sp.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Products</h1>
          <p className={styles.pageSub}>
            Only products marked Live, with a price, show in the shop.
            {unpricedLive > 0 && ` ${unpricedLive} still need${unpricedLive === 1 ? "s" : ""} a price.`}
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          New product
        </Link>
      </div>

      <nav className={styles.tabs} aria-label="Filter by status">
        {STATUS_FILTERS.map((f) => (
          <Link key={f.key} href={href({ status: f.key })} className={styles.tab} aria-current={f.key === status ? "true" : undefined}>
            {f.label}
          </Link>
        ))}
      </nav>

      <form className={styles.toolbar} role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <input className={styles.input} type="search" name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" />
        <select className={styles.select} name="category" defaultValue={category ?? ""} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className={`btn btn-outline ${styles.small}`}>
          Filter
        </button>
      </form>

      <div className={styles.list}>
        {products.length ? (
          products.map((p) => (
            <div key={p.id} className={`${styles.row} ${styles.productRow}`}>
              <Link href={`/admin/products/${p.id}`} className={styles.productMain}>
                <span className={styles.thumb}>
                  <ProductImage image={p.image} alt="" sizes="48px" />
                </span>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>
                    {p.name}
                    {p.status === "active" ? (
                      <span className={styles.badge} data-tone="green">Live</span>
                    ) : p.status === "draft" ? (
                      <span className={styles.badge} data-tone="muted">Draft</span>
                    ) : (
                      <span className={styles.badge} data-tone="muted">Archived</span>
                    )}
                    {!p.inStock && <span className={styles.badge} data-tone="amber">Sold out</span>}
                    {p.isAddon && <span className={styles.badge} data-tone="blue">Add-on</span>}
                  </span>
                  <span className={styles.rowMeta}>
                    {p.category?.name ?? "No category"} ·{" "}
                    {p.minPrice === null
                      ? "No price yet"
                      : p.minPrice === p.maxPrice
                        ? formatPrice(p.minPrice)
                        : `${formatPrice(p.minPrice)}–${formatPrice(p.maxPrice ?? p.minPrice)}`}
                    {p.variants.length > 1 ? ` · ${p.variants.length} sizes` : ""}
                  </span>
                </span>
              </Link>
              <div className={styles.rowSide}>
                <form action={quickProductAction} className={styles.buttons}>
                  <input type="hidden" name="id" value={p.id} />
                  {p.status !== "archived" && (
                    <SubmitButton
                      name="field"
                      value="status"
                      className={`btn btn-outline ${styles.small}`}
                      pendingLabel="…"
                    >
                      {p.status === "active" ? "Hide" : p.unpriced ? "Needs a price" : "Make live"}
                    </SubmitButton>
                  )}
                  <SubmitButton name="field" value="inStock" className={`btn btn-outline ${styles.small}`} pendingLabel="…">
                    {p.inStock ? "Sold out today" : "Back in stock"}
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.empty}>No products match.</p>
        )}
      </div>
    </div>
  );
}
