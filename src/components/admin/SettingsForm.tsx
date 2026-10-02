"use client";

import { useState } from "react";
import { type FormState, saveSettingsAction } from "@/app/admin/actions";
import styles from "./admin.module.css";
import SubmitButton from "./SubmitButton";
import { useStickyAction } from "../useStickyAction";

export type SettingsValues = {
  acceptingOrders: boolean;
  closedMessage: string;
  sameDayCutoff: string;
  leadTimeMinutes: number;
  slots: { start: string; end: string }[];
  daysAhead: number;
  deliveryFee: number | null;
  freeDeliveryAbove: number | null;
  pickupEnabled: boolean;
  upiId: string;
  upiName: string;
  orderWhatsapp: string;
};

let counter = 0;

export default function SettingsForm({ settings }: { settings: SettingsValues }) {
  const { state, onSubmit, pending } = useStickyAction<FormState>(saveSettingsAction, {});
  const err = state.fieldErrors ?? {};
  const [slots, setSlots] = useState(settings.slots.map((s) => ({ ...s, key: counter++ })));

  const fieldError = (key: string) => err[key] && <span className={styles.fieldError}>{err[key]}</span>;

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {state.message && <p className={styles.success}>{state.message}</p>}
      {state.error && (
        <p className={styles.errorBox} role="alert">
          {state.error}
        </p>
      )}

      <section className={`${styles.card} ${styles.form}`}>
        <h2 className={styles.cardTitle}>Online orders</h2>
        <label className={styles.check}>
          <input type="checkbox" name="acceptingOrders" defaultChecked={settings.acceptingOrders} />
          <span className={styles.checkText}>
            <strong>Take orders on the website</strong>
            <span className={styles.hint}>Untick to pause checkout, e.g. on a holiday. The shop stays browsable.</span>
          </span>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Message while paused</span>
          <input name="closedMessage" className={styles.input} defaultValue={settings.closedMessage} maxLength={300} />
        </label>
      </section>

      <section className={`${styles.card} ${styles.form}`}>
        <h2 className={styles.cardTitle}>Delivery</h2>
        <div className={styles.two}>
          <label className={styles.field} data-invalid={err.deliveryFee ? "true" : undefined}>
            <span className={styles.label}>Delivery charge (₹)</span>
            <input
              name="deliveryFee"
              className={styles.input}
              inputMode="numeric"
              defaultValue={settings.deliveryFee ?? ""}
              placeholder="Leave blank to agree it per order"
            />
            <span className={styles.hint}>0 means free delivery. Blank shows “confirmed by Shakha” at checkout.</span>
            {fieldError("deliveryFee")}
          </label>
          <label className={styles.field} data-invalid={err.freeDeliveryAbove ? "true" : undefined}>
            <span className={styles.label}>Free delivery on orders over (₹, optional)</span>
            <input name="freeDeliveryAbove" className={styles.input} inputMode="numeric" defaultValue={settings.freeDeliveryAbove ?? ""} />
            {fieldError("freeDeliveryAbove")}
          </label>
        </div>
        <div className={styles.two}>
          <label className={styles.field} data-invalid={err.sameDayCutoff ? "true" : undefined}>
            <span className={styles.label}>Same-day cut-off (optional)</span>
            <input name="sameDayCutoff" type="time" className={styles.input} defaultValue={settings.sameDayCutoff} />
            <span className={styles.hint}>After this time, the earliest date offered is tomorrow. Also shown on the homepage.</span>
            {fieldError("sameDayCutoff")}
          </label>
          <label className={styles.field} data-invalid={err.leadTimeMinutes ? "true" : undefined}>
            <span className={styles.label}>Time needed to make an order (minutes)</span>
            <input name="leadTimeMinutes" type="number" min={0} max={720} className={styles.input} defaultValue={settings.leadTimeMinutes} />
            <span className={styles.hint}>A slot can be booked only if it ends at least this long from now.</span>
            {fieldError("leadTimeMinutes")}
          </label>
        </div>

        <fieldset className={styles.form} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className={styles.label} style={{ marginBottom: 8 }}>
            Delivery and pickup time slots
          </legend>
          {slots.map((slot, i) => (
            <div key={slot.key} className={styles.variantRow}>
              <label className={styles.field} data-invalid={err[`slots.${i}.start`] || err[`slots.${i}`] ? "true" : undefined}>
                <span className={styles.label}>From</span>
                <input name="slotStart" type="time" className={styles.input} defaultValue={slot.start} required />
              </label>
              <label className={styles.field} data-invalid={err[`slots.${i}.end`] || err[`slots.${i}`] ? "true" : undefined}>
                <span className={styles.label}>To</span>
                <input name="slotEnd" type="time" className={styles.input} defaultValue={slot.end} required />
              </label>
              <button
                type="button"
                className={styles.linkButton}
                disabled={slots.length === 1}
                onClick={() => setSlots((s) => s.filter((x) => x.key !== slot.key))}
              >
                Remove
              </button>
              {(err[`slots.${i}`] || err[`slots.${i}.start`] || err[`slots.${i}.end`]) && (
                <span className={styles.fieldError} style={{ gridColumn: "1 / -1" }}>
                  {err[`slots.${i}`] ?? err[`slots.${i}.start`] ?? err[`slots.${i}.end`]}
                </span>
              )}
            </div>
          ))}
          {fieldError("slots")}
          <div>
            <button
              type="button"
              className={`btn btn-outline ${styles.small}`}
              disabled={slots.length >= 12}
              onClick={() => setSlots((s) => [...s, { start: "", end: "", key: counter++ }])}
            >
              Add a slot
            </button>
          </div>
          <span className={styles.hint}>
            One long slot (like 8 AM – 10 PM) means “any time during opening hours”. Split it into windows if you
            deliver in rounds.
          </span>
        </fieldset>

        <div className={styles.two}>
          <label className={styles.field} data-invalid={err.daysAhead ? "true" : undefined}>
            <span className={styles.label}>How many days ahead customers can book</span>
            <input name="daysAhead" type="number" min={0} max={60} className={styles.input} defaultValue={settings.daysAhead} />
            {fieldError("daysAhead")}
          </label>
          <label className={styles.check} style={{ alignSelf: "center" }}>
            <input type="checkbox" name="pickupEnabled" defaultChecked={settings.pickupEnabled} />
            <span className={styles.checkText}>
              <strong>Offer pickup from the studios</strong>
              <span className={styles.hint}>Vesu and Dumas, in the same time slots.</span>
            </span>
          </label>
        </div>
      </section>

      <section className={`${styles.card} ${styles.form}`}>
        <h2 className={styles.cardTitle}>Payments</h2>
        <p className={styles.hint}>
          Pay on delivery is always on. Add a UPI ID to also let customers pay right after ordering: they get a
          one-tap UPI link and a QR code for the exact amount. You mark the order paid once the money arrives.
        </p>
        <div className={styles.two}>
          <label className={styles.field} data-invalid={err.upiId ? "true" : undefined}>
            <span className={styles.label}>UPI ID (optional)</span>
            <input name="upiId" className={styles.input} defaultValue={settings.upiId} placeholder="shopname@okhdfcbank" />
            {fieldError("upiId")}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Name shown in UPI apps</span>
            <input name="upiName" className={styles.input} defaultValue={settings.upiName} />
          </label>
        </div>
      </section>

      <section className={`${styles.card} ${styles.form}`}>
        <h2 className={styles.cardTitle}>Order messages</h2>
        <label className={styles.field} data-invalid={err.orderWhatsapp ? "true" : undefined}>
          <span className={styles.label}>WhatsApp number that receives new orders</span>
          <input name="orderWhatsapp" className={styles.input} inputMode="numeric" defaultValue={settings.orderWhatsapp} />
          <span className={styles.hint}>With the country code, digits only (91…). Customers send their order summary here.</span>
          {fieldError("orderWhatsapp")}
        </label>
      </section>

      <div className={styles.buttons}>
        <SubmitButton pending={pending}>Save settings</SubmitButton>
      </div>
    </form>
  );
}
