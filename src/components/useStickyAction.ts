"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * Like useActionState, but for forms that must keep what the user entered when
 * the server rejects a submission. React resets a <form action={…}> after every
 * submission, which clears typed text and can even un-check controlled radios
 * while React's state still shows them checked. Submitting from onSubmit avoids
 * the reset entirely.
 */
export function useStickyAction<State extends object>(
  action: (state: State, data: FormData) => Promise<State>,
  initial: State,
) {
  const [state, dispatch, pending] = useActionState<State, FormData>(
    action as (state: Awaited<State>, data: FormData) => Promise<State>,
    initial as Awaited<State>,
  );
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(data));
  };
  return { state: state as State, onSubmit, pending };
}
