"use client";

import { useActionState } from "react";
import { type FormState, saveOrderNoteAction } from "@/app/admin/actions";
import styles from "./admin.module.css";
import SubmitButton from "./SubmitButton";

export default function OrderNoteForm({ id, note }: { id: number; note: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveOrderNoteAction, {});
  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="id" value={id} />
      <label className={styles.field}>
        <span className={styles.label}>Private note</span>
        <textarea
          className={styles.textarea}
          name="adminNote"
          defaultValue={note}
          placeholder="Only the shop sees this: who's delivering, substitutions, payment details…"
        />
      </label>
      <div className={styles.buttons}>
        <SubmitButton className={`btn btn-outline ${styles.small}`}>Save note</SubmitButton>
        {state.message && <span className={styles.hint}>{state.message}</span>}
        {state.error && <span className={styles.fieldError}>{state.error}</span>}
      </div>
    </form>
  );
}
