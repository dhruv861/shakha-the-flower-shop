import { whatsappLink } from "@/lib/site";
import { ArrowIcon, ClockIcon, PinIcon, TruckIcon, WhatsAppIcon } from "./Icons";
import Picture from "./Picture";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section id="top" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.media}>
        <div className={styles.zoom}>
          <Picture
            name="hero-pink-roses"
            alt="A hand-tied bouquet of pink roses and baby's breath in blush and peach wrapping"
            sizes="100vw"
            priority
            className={styles.image}
          />
        </div>
      </div>

      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className="eyebrow">Surat · Since 2014</span>
          <h1 id="hero-title" className={styles.title}>
            Not just flowers.
            <br />
            <em>Emotions, wrapped beautifully.</em>
          </h1>
          <p className={styles.lede}>
            Hand-tied bouquets, creative gift bouquets and luxury hampers from our Surat studios — made to
            order and delivered the same day.
          </p>
          <div className={styles.ctas}>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <WhatsAppIcon />
              Order on WhatsApp
            </a>
            <a href="#signature" className="btn btn-outline">
              See signature bouquets
              <ArrowIcon className={styles.ctaArrow} />
            </a>
          </div>
          <ul className={styles.trust} role="list">
            <li>
              <TruckIcon />
              <span>
                Same-day delivery<span className={styles.wideOnly}> in Surat</span>
              </span>
            </li>
            <li>
              <PinIcon />
              Vesu &amp; Dumas
            </li>
            <li>
              <ClockIcon />
              Open daily from 8 AM
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
