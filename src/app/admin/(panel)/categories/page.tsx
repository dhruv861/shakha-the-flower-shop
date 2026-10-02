import type { Metadata } from "next";
import CategoryForm from "@/components/admin/CategoryForm";
import SubmitButton from "@/components/admin/SubmitButton";
import styles from "@/components/admin/admin.module.css";
import { listCategoriesAdmin } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { deleteCategoryAction } from "../../actions";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await listCategoriesAdmin();
  return (
    <div className={styles.stack}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Categories</h1>
          <p className={styles.pageSub}>The filters along the top of the shop. Empty categories don&apos;t show there.</p>
        </div>
      </div>

      {categories.map((c) => (
        <section key={c.id} className={styles.card}>
          <div className={styles.pageHead} style={{ marginBottom: 12 }}>
            <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
              {c.name}
            </h2>
            <span className={styles.rowMeta}>
              {c.productCount} product{c.productCount === 1 ? "" : "s"}
            </span>
          </div>
          <CategoryForm category={c} />
          <form action={deleteCategoryAction} style={{ marginTop: 12 }}>
            <input type="hidden" name="id" value={c.id} />
            <SubmitButton className={styles.linkButton} pendingLabel="Deleting…">
              Delete category{c.productCount ? " (its products stay, without a category)" : ""}
            </SubmitButton>
          </form>
        </section>
      ))}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Add a category</h2>
        <CategoryForm />
      </section>
    </div>
  );
}
