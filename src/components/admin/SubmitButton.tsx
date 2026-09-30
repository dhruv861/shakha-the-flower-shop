"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** A submit button that disables itself and says so while its form is saving. */
export default function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "btn btn-primary",
  name,
  value,
  pending: forced,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  name?: string;
  value?: string;
  /** For forms submitted from onSubmit, which useFormStatus can't see. */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = forced ?? status.pending;
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
