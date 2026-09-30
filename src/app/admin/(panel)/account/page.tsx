import type { Metadata } from "next";
import { AddAdminForm, ChangePasswordForm } from "@/components/admin/AccountForms";
import SubmitButton from "@/components/admin/SubmitButton";
import styles from "@/components/admin/admin.module.css";
import { listAdmins } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { removeAdminAction, signOutEverywhereAction } from "../../actions";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const me = await requireAdmin();
  const admins = await listAdmins();
  return (
    <div className={styles.stack}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Account</h1>
          <p className={styles.pageSub}>Signed in as {me.email}</p>
        </div>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Change your password</h2>
        <ChangePasswordForm />
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>People who can use the admin</h2>
        <div className={styles.list} style={{ marginBottom: 20 }}>
          {admins.map((a) => (
            <div key={a.id} className={styles.row}>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>
                  {a.name}
                  {a.id === me.id && <span className={styles.badge} data-tone="blue">You</span>}
                </span>
                <span className={styles.rowMeta}>
                  {a.email}
                  {a.lastLoginAt
                    ? ` · last signed in ${a.lastLoginAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" })}`
                    : " · hasn't signed in yet"}
                </span>
              </span>
              {a.id !== me.id && (
                <form action={removeAdminAction} className={styles.rowSide}>
                  <input type="hidden" name="id" value={a.id} />
                  <SubmitButton className={styles.linkButton} pendingLabel="Removing…">
                    Remove
                  </SubmitButton>
                </form>
              )}
            </div>
          ))}
        </div>
        <h3 className={styles.label} style={{ marginBottom: 10 }}>
          Add someone
        </h3>
        <AddAdminForm />
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Sessions</h2>
        <p className={styles.hint} style={{ marginBottom: 12 }}>
          Lost a phone or used a shared computer? Sign out of the admin everywhere.
        </p>
        <form action={signOutEverywhereAction}>
          <SubmitButton className={`btn ${styles.small} ${styles.danger}`} pendingLabel="Signing out…">
            Sign out everywhere
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
