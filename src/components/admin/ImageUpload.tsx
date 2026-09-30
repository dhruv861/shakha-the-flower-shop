"use client";

import { useActionState, useRef } from "react";
import { type FormState, uploadImagesAction } from "@/app/admin/actions";
import styles from "./admin.module.css";
import SubmitButton from "./SubmitButton";

export default function ImageUpload({ productId }: { productId: number }) {
  const [state, formAction] = useActionState<FormState, FormData>(uploadImagesAction, {});
  const input = useRef<HTMLInputElement>(null);
  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="productId" value={productId} />
      <label className={styles.field}>
        <span className={styles.label}>Add photos</span>
        <input ref={input} type="file" name="images" accept="image/jpeg,image/png,image/webp,image/avif" multiple className={styles.input} />
        <span className={styles.hint}>
          JPG, PNG or WebP, up to 15 MB each. Portrait photos (4:5) look best. Location data is removed automatically.
        </span>
      </label>
      <div className={styles.buttons}>
        <SubmitButton className={`btn btn-outline ${styles.small}`} pendingLabel="Uploading…">
          Upload
        </SubmitButton>
        {state.message && <span className={styles.hint}>{state.message}</span>}
      </div>
      {state.error && <p className={styles.fieldError}>{state.error}</p>}
    </form>
  );
}
