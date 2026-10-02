import type { Metadata } from "next";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";
import styles from "@/components/admin/admin.module.css";
import { listCategoriesAdmin } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await listCategoriesAdmin();
  return (
    <div>
      <Link href="/admin/products" className={styles.back}>
        ← Products
      </Link>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>New product</h1>
          <p className={styles.pageSub}>Save it first, then add photos.</p>
        </div>
      </div>
      <ProductForm
        categories={categories}
        product={{
          id: null,
          name: "",
          slug: "",
          categoryId: null,
          summary: "",
          description: "",
          occasions: [],
          status: "draft",
          inStock: true,
          featured: false,
          isAddon: false,
          sortOrder: 0,
          variants: [{ id: null, name: "Standard", price: null }],
        }}
      />
    </div>
  );
}
