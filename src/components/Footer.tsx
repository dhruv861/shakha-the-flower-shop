import { branches, site, whatsappLink } from "@/lib/site";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={`${styles.footer} on-dark`}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            <a href="#top" className={styles.logo}>
              <span className={styles.logoMark}>Shakha</span>{" "}
              <span className={styles.logoSub}>The Flower Shop</span>
            </a>
            <p className={styles.tagline}>Not just flowers — emotions, wrapped beautifully.</p>
          </div>

          <div className={styles.cols}>
            <nav className={styles.col} aria-labelledby="footer-shop">
              <h2 id="footer-shop" className={styles.colTitle}>
                Shop
              </h2>
              <a href="#signature">Signature creations</a>
              <a href="#occasions">Occasions</a>
              <a href="#occasions">Hampers</a>
              <a href="#weddings">Weddings &amp; décor</a>
            </nav>
            <div className={styles.col}>
              <h2 className={styles.colTitle}>Visit</h2>
              {branches.map((branch) => (
                <span key={branch.id}>
                  {branch.shortName} · <span className={styles.nowrap}>{branch.shortHours}</span>
                </span>
              ))}
              <a href="#visit">Get directions</a>
            </div>
            <div className={styles.col}>
              <h2 className={styles.colTitle}>Contact</h2>
              <a href={site.phone.href}>{site.phone.display}</a>
              <a href={`mailto:${site.email}`} className={styles.email}>
                {site.email}
              </a>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>
            © {year} {site.name}, {site.city}
          </span>
          <span>Same-day delivery in Surat · Open daily</span>
        </div>
      </div>
    </footer>
  );
}
