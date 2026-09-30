import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import styles from "@/components/admin/admin.module.css";
import { newOrderCount } from "@/lib/admin-queries";
import { getCurrentAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";

// Shell only. Each page (and each action) checks the session itself.
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await getCurrentAdmin();
  const newOrders = admin ? await newOrderCount() : 0;
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topInner}>
          <Link href="/admin" className={styles.brand}>
            <span className={styles.brandMark}>SHAKHA</span>
            <span className={styles.brandSub}>Admin</span>
          </Link>
          <div className={styles.topLinks}>
            {admin && <span className={styles.who}>{admin.name}</span>}
            <a href="/" target="_blank" rel="noopener">
              View shop
            </a>
            {admin && (
              <form action={logoutAction}>
                <button type="submit">Log out</button>
              </form>
            )}
          </div>
        </div>
        {admin && <AdminNav newOrders={newOrders} />}
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
