import type { Metadata } from "next";
import SettingsForm from "@/components/admin/SettingsForm";
import styles from "@/components/admin/admin.module.css";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSub}>Delivery, payments and ordering rules. Changes show on the site straight away.</p>
        </div>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
