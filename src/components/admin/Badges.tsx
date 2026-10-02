import type { OrderStatus, PaymentStatus } from "@/db/schema";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/order-status";
import styles from "./admin.module.css";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={styles.badge} data-tone={STATUS_TONE[status]}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentBadge({ status, method }: { status: PaymentStatus; method: "pay_on_delivery" | "upi" }) {
  if (status === "paid")
    return (
      <span className={styles.badge} data-tone="green">
        Paid
      </span>
    );
  if (status === "refunded")
    return (
      <span className={styles.badge} data-tone="muted">
        Refunded
      </span>
    );
  return (
    <span className={styles.badge} data-tone={method === "upi" ? "amber" : "muted"}>
      {method === "upi" ? "UPI pending" : "Pay later"}
    </span>
  );
}
