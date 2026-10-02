import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>Shakha</span>{" "}
          <span className={styles.logoSub}>The Flower Shop</span>
        </Link>
        <h1 className={styles.title}>Shop admin</h1>
        <p className={styles.sub}>Sign in to manage orders, products and settings.</p>
        <LoginForm />
      </div>
    </main>
  );
}
