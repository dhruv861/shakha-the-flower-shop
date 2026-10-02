"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { placeOrderAction, type CheckoutState } from "@/app/(store)/actions";
import { formatPrice } from "@/lib/money";
import { useCart, useHydrated } from "./cart-store";
import { useStickyAction } from "../useStickyAction";
import ProductImage from "./ProductImage";
import { useLivePrices } from "./useLivePrices";
import styles from "./CheckoutForm.module.css";

type Day = { dateKey: string; day: string; date: string; slots: string[] };
type Branch = { id: "vesu" | "dumas"; name: string; address: string; hours: string };

type Props = {
  days: Day[];
  branches: Branch[];
  pickupEnabled: boolean;
  upiEnabled: boolean;
  acceptingOrders: boolean;
  closedMessage: string;
  cutoffNote: string | null;
  whatsappHref: string;
};

function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field} data-invalid={error ? "true" : undefined}>
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && (
        <span className={styles.error} id={`${name}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

function SubmitButton({ total, disabled, pending }: { total: string; disabled: boolean; pending: boolean }) {
  return (
    <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={disabled || pending}>
      {pending ? "Placing your order…" : `Place order · ${total}`}
    </button>
  );
}

export default function CheckoutForm(props: Props) {
  const lines = useCart();
  const hydrated = useHydrated();
  const { state, onSubmit, pending } = useStickyAction<CheckoutState>(placeOrderAction, {});
  const v = state.values ?? {};
  const err = state.fieldErrors ?? {};

  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [sameRecipient, setSameRecipient] = useState(false);
  const [branch, setBranch] = useState<"vesu" | "dumas">("vesu");
  const [dateKey, setDateKey] = useState(props.days[0]?.dateKey ?? "");
  const [slot, setSlot] = useState(props.days[0]?.slots[0] ?? "");
  const [payment, setPayment] = useState<"pay_on_delivery" | "upi">("pay_on_delivery");
  const [gift, setGift] = useState("");

  const { priced, issues, subtotal } = useLivePrices(lines, hydrated && lines.length > 0, fulfillment);
  const deliveryFee = priced ? priced.deliveryFee : null;
  const day = props.days.find((d) => d.dateKey === dateKey) ?? props.days[0];
  const delivery = fulfillment === "delivery";

  if (!hydrated) return <p className={styles.loading}>Loading your order…</p>;

  if (!lines.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Your cart is empty.</p>
        <Link href="/shop" className="btn btn-primary">
          Browse the shop
        </Link>
      </div>
    );
  }

  const feeLabel =
    fulfillment === "pickup" ? "Free (pickup)" : deliveryFee === null ? "Confirmed by Shakha" : deliveryFee === 0 ? "Free" : formatPrice(deliveryFee);
  const total = subtotal + (deliveryFee ?? 0);
  const totalLabel = `${formatPrice(total)}${delivery && deliveryFee === null ? " + delivery" : ""}`;
  const blocked = !props.acceptingOrders || !props.days.length || issues.size > 0;

  return (
    <form onSubmit={onSubmit} className={styles.layout} noValidate>
      <input type="hidden" name="cart" value={JSON.stringify(lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })))} />
      <input type="hidden" name="deliveryDate" value={dateKey} />
      <input type="hidden" name="deliverySlot" value={slot} />

      <div className={styles.main}>
        {state.error && (
          <p className={styles.formError} role="alert">
            {state.error}
          </p>
        )}

        <fieldset className={styles.section}>
          <legend className={styles.legend}>
            <span className={styles.step}>1</span> Your details
          </legend>
          <div className={styles.row}>
            <Field label="Your name" name="customerName" error={err.customerName}>
              <input id="customerName" name="customerName" autoComplete="name" defaultValue={v.customerName} required />
            </Field>
            <Field label="Mobile number" name="customerPhone" error={err.customerPhone} hint="We'll call or WhatsApp you about the order.">
              <input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="98765 43210"
                defaultValue={v.customerPhone}
                required
              />
            </Field>
          </div>
          <Field label="Email (optional)" name="customerEmail" error={err.customerEmail}>
            <input id="customerEmail" name="customerEmail" type="email" autoComplete="email" defaultValue={v.customerEmail} />
          </Field>
        </fieldset>

        <fieldset className={styles.section}>
          <legend className={styles.legend}>
            <span className={styles.step}>2</span> Delivery or pickup
          </legend>
          <div className={styles.choices}>
            <label className={styles.choice}>
              <input
                type="radio"
                name="fulfillment"
                value="delivery"
                checked={delivery}
                onChange={() => setFulfillment("delivery")}
              />
              <span className={styles.choiceTitle}>Delivery in Surat</span>
              <span className={styles.choiceText}>To any home or office address.</span>
            </label>
            {props.pickupEnabled && (
              <label className={styles.choice}>
                <input
                  type="radio"
                  name="fulfillment"
                  value="pickup"
                  checked={!delivery}
                  onChange={() => setFulfillment("pickup")}
                />
                <span className={styles.choiceTitle}>Pick up from a studio</span>
                <span className={styles.choiceText}>Vesu or Dumas, at a time you choose.</span>
              </label>
            )}
          </div>

          {delivery ? (
            <>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  name="sameRecipient"
                  checked={sameRecipient}
                  onChange={(e) => setSameRecipient(e.target.checked)}
                />
                It&apos;s for me: deliver to my own name and number
              </label>
              {!sameRecipient && (
                <div className={styles.row}>
                  <Field label="Recipient's name" name="recipientName" error={err.recipientName}>
                    <input id="recipientName" name="recipientName" autoComplete="off" defaultValue={v.recipientName} />
                  </Field>
                  <Field label="Recipient's mobile" name="recipientPhone" error={err.recipientPhone} hint="Our delivery team calls this number.">
                    <input id="recipientPhone" name="recipientPhone" type="tel" inputMode="tel" autoComplete="off" defaultValue={v.recipientPhone} />
                  </Field>
                </div>
              )}
              <Field label="Delivery address" name="addressLine" error={err.addressLine}>
                <textarea
                  id="addressLine"
                  name="addressLine"
                  rows={2}
                  autoComplete="street-address"
                  placeholder="House / flat, building, street"
                  defaultValue={v.addressLine}
                />
              </Field>
              <div className={styles.row3}>
                <Field label="Area" name="area" error={err.area}>
                  <input id="area" name="area" placeholder="e.g. Vesu" defaultValue={v.area} />
                </Field>
                <Field label="Pincode" name="pincode" error={err.pincode}>
                  <input
                    id="pincode"
                    name="pincode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    defaultValue={v.pincode}
                  />
                </Field>
                <Field label="Landmark (optional)" name="landmark" error={err.landmark}>
                  <input id="landmark" name="landmark" defaultValue={v.landmark} />
                </Field>
              </div>
            </>
          ) : (
            <div className={styles.choices}>
              {props.branches.map((b) => (
                <label key={b.id} className={styles.choice}>
                  <input
                    type="radio"
                    name="pickupBranch"
                    value={b.id}
                    checked={branch === b.id}
                    onChange={() => setBranch(b.id)}
                  />
                  <span className={styles.choiceTitle}>{b.name}</span>
                  <span className={styles.choiceText}>{b.address}</span>
                  <span className={styles.choiceText}>{b.hours}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset className={styles.section}>
          <legend className={styles.legend}>
            <span className={styles.step}>3</span> {delivery ? "Delivery date and time" : "Pickup date and time"}
          </legend>
          {props.days.length ? (
            <>
              <div className={styles.dates} role="radiogroup" aria-label="Date">
                {props.days.map((d) => (
                  <button
                    key={d.dateKey}
                    type="button"
                    role="radio"
                    aria-checked={d.dateKey === dateKey}
                    className={styles.date}
                    onClick={() => {
                      setDateKey(d.dateKey);
                      setSlot(d.slots[0]);
                    }}
                  >
                    <span className={styles.dateDay}>{d.day}</span>
                    <span>{d.date}</span>
                  </button>
                ))}
              </div>
              <div className={styles.slots} role="radiogroup" aria-label="Time">
                {day?.slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={s === slot}
                    className={styles.slot}
                    onClick={() => setSlot(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {(err.deliveryDate || err.deliverySlot) && (
                <span className={styles.error}>{err.deliveryDate ?? err.deliverySlot}</span>
              )}
              {props.cutoffNote && <p className={styles.hint}>{props.cutoffNote}</p>}
            </>
          ) : (
            <p className={styles.notice}>
              No delivery times are open right now.{" "}
              <a href={props.whatsappHref} target="_blank" rel="noopener noreferrer">
                Message us on WhatsApp
              </a>{" "}
              and we&apos;ll help.
            </p>
          )}
        </fieldset>

        <fieldset className={styles.section}>
          <legend className={styles.legend}>
            <span className={styles.step}>4</span> Gift message
          </legend>
          <Field label="Message for the card (optional)" name="giftMessage" error={err.giftMessage} hint={`${gift.length}/300 · We'll handwrite this on the card.`}>
            <textarea
              id="giftMessage"
              name="giftMessage"
              rows={3}
              maxLength={300}
              value={gift}
              onChange={(e) => setGift(e.target.value)}
            />
          </Field>
          <Field label="Anything else for the florist? (optional)" name="customerNote" error={err.customerNote}>
            <textarea
              id="customerNote"
              name="customerNote"
              rows={2}
              maxLength={500}
              placeholder="Colours to avoid, a surprise delivery, gate code…"
              defaultValue={v.customerNote}
            />
          </Field>
        </fieldset>

        <fieldset className={styles.section}>
          <legend className={styles.legend}>
            <span className={styles.step}>5</span> Payment
          </legend>
          <div className={styles.choices}>
            <label className={styles.choice}>
              <input
                type="radio"
                name="paymentMethod"
                value="pay_on_delivery"
                checked={payment === "pay_on_delivery"}
                onChange={() => setPayment("pay_on_delivery")}
              />
              <span className={styles.choiceTitle}>{delivery ? "Pay on delivery" : "Pay at the studio"}</span>
              <span className={styles.choiceText}>
                {delivery ? "Cash or UPI when your order arrives." : "Cash, card or UPI when you collect."}
              </span>
            </label>
            {props.upiEnabled && (
              <label className={styles.choice}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={payment === "upi"}
                  onChange={() => setPayment("upi")}
                />
                <span className={styles.choiceTitle}>Pay now with UPI</span>
                <span className={styles.choiceText}>From any UPI app, right after you place the order.</span>
              </label>
            )}
          </div>
        </fieldset>
      </div>

      <aside className={styles.summary} aria-label="Order summary">
        <p className={styles.summaryTitle}>Your order</p>
        <ul className={styles.items} role="list">
          {lines.map((l) => (
            <li key={l.variantId} className={styles.item}>
              <span className={styles.itemThumb}>
                <ProductImage image={l.image} alt="" sizes="56px" />
                <span className={styles.itemQty}>{l.quantity}</span>
              </span>
              <span className={styles.itemName}>
                {l.name}
                {l.variantName !== "Standard" && <span className={styles.itemMeta}>{l.variantName}</span>}
                {issues.get(l.variantId) && <span className={styles.error}>{issues.get(l.variantId)}</span>}
              </span>
              <span>{formatPrice(l.unitPrice * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className={styles.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div>
            <dt>{delivery ? "Delivery" : "Pickup"}</dt>
            <dd>{feeLabel}</dd>
          </div>
          <div className={styles.grand}>
            <dt>Total</dt>
            <dd>{totalLabel}</dd>
          </div>
        </dl>
        {!props.acceptingOrders && <p className={styles.error}>{props.closedMessage}</p>}
        {issues.size > 0 && (
          <p className={styles.error}>
            Some items can&apos;t be ordered right now. <Link href="/cart">Update your cart</Link>.
          </p>
        )}
        <SubmitButton total={totalLabel} disabled={blocked} pending={pending} />
        <p className={styles.small}>
          We&apos;ll confirm your order on WhatsApp or by phone.
          {delivery && deliveryFee === null && " The delivery charge depends on your area; we'll tell you before we confirm."}
        </p>
      </aside>
    </form>
  );
}
