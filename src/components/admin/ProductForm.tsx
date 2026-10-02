"use client";

import { useState } from "react";
import { deleteProductAction, type FormState, saveProductAction } from "@/app/admin/actions";
import { OCCASIONS } from "@/lib/occasions";
import { slugify } from "@/lib/slug";
import styles from "./admin.module.css";
import SubmitButton from "./SubmitButton";
import { useStickyAction } from "../useStickyAction";

type Variant = { id: number | null; name: string; price: string; key: string };

export type ProductFormValues = {
  id: number | null;
  name: string;
  slug: string;
  categoryId: number | null;
  summary: string;
  description: string;
  occasions: string[];
  status: "draft" | "active" | "archived";
  inStock: boolean;
  featured: boolean;
  isAddon: boolean;
  sortOrder: number;
  variants: { id: number | null; name: string; price: number | null }[];
};

let nextKey = 0;
const newKey = () => `new-${nextKey++}`;

export default function ProductForm({
  product,
  categories,
  notice,
}: {
  product: ProductFormValues;
  categories: { id: number; name: string }[];
  notice?: string;
}) {
  const { state, onSubmit, pending } = useStickyAction<FormState>(saveProductAction, {});
  const err = state.fieldErrors ?? {};
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(product.id));
  const [variants, setVariants] = useState<Variant[]>(
    product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price === null ? "" : String(v.price), key: String(v.id ?? newKey()) })),
  );

  const update = (key: string, patch: Partial<Variant>) =>
    setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  return (
    <div className={styles.stack}>
      <form onSubmit={onSubmit} className={styles.form}>
        {product.id && <input type="hidden" name="id" value={product.id} />}
        {notice && !state.error && <p className={styles.success}>{notice}</p>}
        {state.error && (
          <p className={styles.errorBox} role="alert">
            {state.error}
          </p>
        )}

        <section className={`${styles.card} ${styles.form}`}>
          <h2 className={styles.cardTitle}>Basics</h2>
          <div className={styles.field} data-invalid={err.name ? "true" : undefined}>
            <label className={styles.label} htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              className={styles.input}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
            {err.name && <span className={styles.fieldError}>{err.name}</span>}
          </div>
          <div className={styles.field} data-invalid={err.slug ? "true" : undefined}>
            <label className={styles.label} htmlFor="slug">
              Web address
            </label>
            <div className={styles.prefixed}>
              <span className={styles.prefix}>/shop/</span>
              <input
                id="slug"
                name="slug"
                className={styles.input}
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase());
                }}
              />
            </div>
            {err.slug ? (
              <span className={styles.fieldError}>{err.slug}</span>
            ) : (
              product.id && <span className={styles.hint}>Changing this breaks links people may have saved.</span>
            )}
          </div>
          <div className={styles.two}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="categoryId">
                Category
              </label>
              <select id="categoryId" name="categoryId" className={styles.select} defaultValue={product.categoryId ?? ""}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sortOrder">
                Order in the shop
              </label>
              <input id="sortOrder" name="sortOrder" type="number" min={0} max={9999} className={styles.input} defaultValue={product.sortOrder} />
              <span className={styles.hint}>Lower numbers come first.</span>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="summary">
              Short description
            </label>
            <input id="summary" name="summary" className={styles.input} maxLength={200} defaultValue={product.summary} />
            <span className={styles.hint}>One line, shown on product cards.</span>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">
              Full description (optional)
            </label>
            <textarea id="description" name="description" className={styles.textarea} maxLength={4000} defaultValue={product.description} />
            <span className={styles.hint}>Leave a blank line between paragraphs.</span>
          </div>
        </section>

        <section className={`${styles.card} ${styles.form}`}>
          <h2 className={styles.cardTitle}>Sizes and prices</h2>
          <p className={styles.hint}>
            Most products need one size (“Standard”). Add more for options like Classic, Deluxe or Grand. Leave a price
            blank if you don&apos;t sell that size yet.
          </p>
          {variants.map((v, i) => (
            <div key={v.key} className={styles.variantRow}>
              <input type="hidden" name="variantId" value={v.id ?? ""} />
              <div className={styles.field} data-invalid={err[`variants.${i}.name`] ? "true" : undefined}>
                <label className={styles.label} htmlFor={`vn-${v.key}`}>
                  Size name
                </label>
                <input
                  id={`vn-${v.key}`}
                  name="variantName"
                  className={styles.input}
                  value={v.name}
                  onChange={(e) => update(v.key, { name: e.target.value })}
                />
                {err[`variants.${i}.name`] && <span className={styles.fieldError}>{err[`variants.${i}.name`]}</span>}
              </div>
              <div className={styles.field} data-invalid={err[`variants.${i}.price`] ? "true" : undefined}>
                <label className={styles.label} htmlFor={`vp-${v.key}`}>
                  Price (₹)
                </label>
                <input
                  id={`vp-${v.key}`}
                  name="variantPrice"
                  className={styles.input}
                  inputMode="numeric"
                  placeholder="e.g. 1299"
                  value={v.price}
                  onChange={(e) => update(v.key, { price: e.target.value })}
                />
                {err[`variants.${i}.price`] && <span className={styles.fieldError}>{err[`variants.${i}.price`]}</span>}
              </div>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))}
                disabled={variants.length === 1}
                aria-label={`Remove size ${v.name || i + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
          {err.variants && <span className={styles.fieldError}>{err.variants}</span>}
          <div>
            <button
              type="button"
              className={`btn btn-outline ${styles.small}`}
              onClick={() => setVariants((vs) => [...vs, { id: null, name: "", price: "", key: newKey() }])}
              disabled={variants.length >= 12}
            >
              Add a size
            </button>
          </div>
        </section>

        <section className={`${styles.card} ${styles.form}`}>
          <h2 className={styles.cardTitle}>In the shop</h2>
          <fieldset className={styles.form} style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className={styles.label} style={{ marginBottom: 8 }}>
              Status
            </legend>
            <label className={styles.check}>
              <input type="radio" name="status" value="active" defaultChecked={product.status === "active"} />
              <span className={styles.checkText}>
                <strong>Live</strong>
                <span className={styles.hint}>Shown in the shop. Needs at least one price.</span>
              </span>
            </label>
            <label className={styles.check}>
              <input type="radio" name="status" value="draft" defaultChecked={product.status === "draft"} />
              <span className={styles.checkText}>
                <strong>Draft</strong>
                <span className={styles.hint}>Hidden while you work on it.</span>
              </span>
            </label>
            <label className={styles.check}>
              <input type="radio" name="status" value="archived" defaultChecked={product.status === "archived"} />
              <span className={styles.checkText}>
                <strong>Archived</strong>
                <span className={styles.hint}>Retired. Kept so old orders still make sense.</span>
              </span>
            </label>
          </fieldset>
          <label className={styles.check}>
            <input type="checkbox" name="inStock" defaultChecked={product.inStock} />
            <span className={styles.checkText}>
              <strong>Available today</strong>
              <span className={styles.hint}>Untick when it&apos;s sold out; it stays listed as “Sold out today”.</span>
            </span>
          </label>
          <label className={styles.check}>
            <input type="checkbox" name="isAddon" defaultChecked={product.isAddon} />
            <span className={styles.checkText}>
              <strong>Gift add-on</strong>
              <span className={styles.hint}>Offered on every product page under “Make it a gift”.</span>
            </span>
          </label>
          <label className={styles.check}>
            <input type="checkbox" name="featured" defaultChecked={product.featured} />
            <span className={styles.checkText}>
              <strong>Featured</strong>
              <span className={styles.hint}>A favourite; used to highlight products.</span>
            </span>
          </label>
          <fieldset className={styles.form} style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className={styles.label} style={{ marginBottom: 8 }}>
              Occasions (for the shop filters)
            </legend>
            <div className={styles.two}>
              {OCCASIONS.map((o) => (
                <label key={o.slug} className={styles.check}>
                  <input type="checkbox" name="occasions" value={o.slug} defaultChecked={product.occasions.includes(o.slug)} />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <div className={styles.buttons}>
          <SubmitButton pending={pending}>{product.id ? "Save changes" : "Create product"}</SubmitButton>
        </div>
      </form>

      {product.id && (
        <form
          action={deleteProductAction}
          onSubmit={(e) => {
            if (!window.confirm(`Delete ${product.name}? This can't be undone. Past orders keep their details.`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={product.id} />
          <SubmitButton className={`btn ${styles.small} ${styles.danger}`} pendingLabel="Deleting…">
            Delete product
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
