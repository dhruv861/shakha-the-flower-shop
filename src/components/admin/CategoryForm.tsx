"use client";

import { useEffect, useRef } from "react";
import { type FormState, saveCategoryAction } from "@/app/admin/actions";
import styles from "./admin.module.css";
import SubmitButton from "./SubmitButton";
import { useStickyAction } from "../useStickyAction";

type Category = { id: number; name: string; slug: string; description: string; sortOrder: number };

export default function CategoryForm({ category }: { category?: Category }) {
  const { state, onSubmit, pending } = useStickyAction<FormState>(saveCategoryAction, {});
  const err = state.fieldErrors ?? {};
  const uid = category ? `c${category.id}` : "new";
  const form = useRef<HTMLFormElement>(null);
  // The "Add a category" form empties once its category is added, so it can't be added twice.
  useEffect(() => {
    if (!category && state.ok) form.current?.reset();
  }, [category, state]);
  return (
    <form ref={form} onSubmit={onSubmit} className={styles.form}>
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className={styles.two}>
        <div className={styles.field} data-invalid={err.name ? "true" : undefined}>
          <label className={styles.label} htmlFor={`${uid}-name`}>
            Name
          </label>
          <input id={`${uid}-name`} name="name" className={styles.input} defaultValue={category?.name} required />
          {err.name && <span className={styles.fieldError}>{err.name}</span>}
        </div>
        <div className={styles.field} data-invalid={err.slug ? "true" : undefined}>
          <label className={styles.label} htmlFor={`${uid}-slug`}>
            Web address
          </label>
          <div className={styles.prefixed}>
            <span className={styles.prefix}>?category=</span>
            <input id={`${uid}-slug`} name="slug" className={styles.input} defaultValue={category?.slug} placeholder="from the name" />
          </div>
          {err.slug && <span className={styles.fieldError}>{err.slug}</span>}
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${uid}-description`}>
          Description (shown at the top of the shop)
        </label>
        <input id={`${uid}-description`} name="description" className={styles.input} defaultValue={category?.description} maxLength={300} />
      </div>
      <div className={styles.buttons}>
        <label className={styles.field} style={{ width: 120 }}>
          <span className={styles.label}>Order</span>
          <input name="sortOrder" type="number" min={0} max={999} className={styles.input} defaultValue={category?.sortOrder ?? 0} />
        </label>
        <div style={{ alignSelf: "flex-end" }} className={styles.buttons}>
          <SubmitButton pending={pending} className={`btn ${category ? "btn-outline" : "btn-primary"} ${styles.small}`}>
            {category ? "Save" : "Add category"}
          </SubmitButton>
          {state.message && <span className={styles.hint}>{state.message}</span>}
        </div>
      </div>
      {state.error && <span className={styles.fieldError}>{state.error}</span>}
    </form>
  );
}
