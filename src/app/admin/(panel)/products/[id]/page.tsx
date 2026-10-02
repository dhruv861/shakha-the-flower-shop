import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImageManager from "@/components/admin/ImageManager";
import ProductForm from "@/components/admin/ProductForm";
import styles from "@/components/admin/admin.module.css";
import { getProductAdmin, listCategoriesAdmin } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const [product, categories] = await Promise.all([getProductAdmin(Number((await params).id)), listCategoriesAdmin()]);
  if (!product) notFound();
  const sp = await searchParams;
  const notice = sp.created === "1" ? "Product created. Add photos, then make it live." : sp.saved === "1" ? "Saved. The shop is updated." : undefined;

  return (
    <div>
      <Link href="/admin/products" className={styles.back}>
        ← Products
      </Link>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{product.name}</h1>
          <p className={styles.pageSub}>
            {product.status === "active" ? (
              <>
                Live in the shop ·{" "}
                <a href={`/shop/${product.slug}`} target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>
                  View it
                </a>
              </>
            ) : product.status === "draft" ? (
              "Draft: not in the shop yet."
            ) : (
              "Archived: hidden from the shop."
            )}
          </p>
        </div>
      </div>
      <div className={styles.cols}>
        <ProductForm
          key={product.updatedAt.getTime()}
          notice={notice}
          categories={categories}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            categoryId: product.categoryId,
            summary: product.summary,
            description: product.description,
            occasions: product.occasions,
            status: product.status,
            inStock: product.inStock,
            featured: product.featured,
            isAddon: product.isAddon,
            sortOrder: product.sortOrder,
            variants: product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
          }}
        />
        <ImageManager productId={product.id} images={product.images} />
      </div>
    </div>
  );
}
