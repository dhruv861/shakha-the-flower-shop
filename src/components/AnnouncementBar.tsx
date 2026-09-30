import { whatsappLink } from "@/lib/site";
import styles from "./AnnouncementBar.module.css";

export default function AnnouncementBar() {
  return (
    <div className={styles.bar}>
      <span>Same-day delivery in Surat</span>
      <span className={styles.wide} aria-hidden="true">
        ·
      </span>
      <span className={`${styles.wide} ${styles.hinglish}`}>Last minute ho? Tension nahi.</span>
      <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={styles.link}>
        Order on WhatsApp
      </a>
    </div>
  );
}
