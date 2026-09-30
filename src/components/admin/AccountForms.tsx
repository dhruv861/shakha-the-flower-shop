"use client";

import { useActionState } from "react";
import { addAdminAction, changePasswordAction, type FormState } from "@/app/admin/actions";
import styles from "./admin.module.css";
import SubmitButton from "./SubmitButton";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(changePasswordAction, {});
  const err = state.fieldErrors ?? {};
  return (
    <form action={formAction} className={styles.form}>
      {state.message && <p className={styles.success}>{state.message}</p>}
      {state.error && <p className={styles.errorBox}>{state.error}</p>}
      <label className={styles.field} data-invalid={err.current ? "true" : undefined}>
        <span className={styles.label}>Current password</span>
        <input name="current" type="password" autoComplete="current-password" className={styles.input} required />
      </label>
      <div className={styles.two}>
        <label className={styles.field} data-invalid={err.next ? "true" : undefined}>
          <span className={styles.label}>New password</span>
          <input name="next" type="password" autoComplete="new-password" minLength={10} className={styles.input} required />
          <span className={styles.hint}>At least 10 characters.</span>
        </label>
        <label className={styles.field} data-invalid={err.confirm ? "true" : undefined}>
          <span className={styles.label}>New password again</span>
          <input name="confirm" type="password" autoComplete="new-password" className={styles.input} required />
        </label>
      </div>
      <div className={styles.buttons}>
        <SubmitButton className={`btn btn-outline ${styles.small}`}>Change password</SubmitButton>
      </div>
    </form>
  );
}

export function AddAdminForm() {
  const [state, formAction] = useActionState<FormState, FormData>(addAdminAction, {});
  const err = state.fieldErrors ?? {};
  return (
    <form action={formAction} className={styles.form}>
      {state.message && <p className={styles.success}>{state.message}</p>}
      {state.error && <p className={styles.errorBox}>{state.error}</p>}
      <div className={styles.two}>
        <label className={styles.field} data-invalid={err.email ? "true" : undefined}>
          <span className={styles.label}>Email</span>
          <input name="email" type="email" className={styles.input} required />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Name</span>
          <input name="name" className={styles.input} />
        </label>
      </div>
      <div className={styles.buttons}>
        <SubmitButton className={`btn btn-outline ${styles.small}`}>Add admin</SubmitButton>
      </div>
    </form>
  );
}
