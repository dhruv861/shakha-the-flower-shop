"use client";

import { useActionState } from "react";
import SubmitButton from "@/components/admin/SubmitButton";
import { type FormState, loginAction } from "../actions";
import styles from "./login.module.css";

export default function LoginForm() {
  const [state, formAction] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={formAction} className={styles.form}>
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <label className={styles.field}>
        <span>Email</span>
        <input name="email" type="email" autoComplete="username" required autoFocus />
      </label>
      <label className={styles.field}>
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <SubmitButton pendingLabel="Signing in…" className={`btn btn-primary ${styles.submit}`}>
        Sign in
      </SubmitButton>
    </form>
  );
}
