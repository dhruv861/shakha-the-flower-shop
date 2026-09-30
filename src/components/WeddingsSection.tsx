import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "./Icons";
import Picture from "./Picture";
import type { ImageName } from "./Picture";
import styles from "./WeddingsSection.module.css";

const PHOTOS: { image: ImageName; alt: string; caption: string; short: string }[] = [
  {
    image: "wedding-garland",
    alt: "A white flower varmala garland made by Shakha",
    caption: "Varmala garland",
    short: "Varmala",
  },
  {
    image: "wedding-car",
    alt: "A white car dressed with Shakha's floral arrangements for a wedding",
    caption: "Wedding-car décor",
    short: "Car décor",
  },
  {
    image: "event-floral-arch",
    alt: "A floral arch decoration by Shakha",
    caption: "Floral arch",
    short: "Floral arch",
  },
];

const SERVICES = ["Varmala", "Car décor", "Floral arches", "Festival décor"];

const decorLink = whatsappLink("Hi Shakha! I'd like to plan décor for a wedding or event.");

function DecorButton({ className }: { className: string }) {
  return (
    <a href={decorLink} target="_blank" rel="noopener noreferrer" className={`btn btn-primary ${className}`}>
      <WhatsAppIcon />
      Plan your décor on WhatsApp
    </a>
  );
}

export default function WeddingsSection() {
  return (
    <section id="weddings" className={styles.section} aria-labelledby="weddings-title">
      <div className={`container ${styles.inner}`}>
        <div className={`${styles.text} rise`}>
          <span className="eyebrow">Weddings &amp; celebrations</span>
          <h2 id="weddings-title" className="display">
            For the big days, <em>too.</em>
          </h2>
          <p className="lead">
            Varmala garlands, wedding-car décor, floral arches and festival décor — made by the same hands
            that make our bouquets.
          </p>
          <ul className={styles.chips} role="list">
            {SERVICES.map((service) => (
              <li key={service} className="chip">
                {service}
              </li>
            ))}
          </ul>
          <DecorButton className={styles.ctaWide} />
        </div>

        <ul className={styles.gallery} role="list">
          {PHOTOS.map((photo, i) => (
            <li key={photo.image} className="rise" data-d={i + 1} data-dm={i}>
              <figure className={styles.figure}>
                <div className={`${styles.photo} frame`}>
                  <Picture
                    name={photo.image}
                    alt={photo.alt}
                    sizes="(min-width: 1024px) 240px, (min-width: 768px) 30vw, 29vw"
                  />
                </div>
                <figcaption className={styles.caption}>
                  <span className={styles.captionLong}>{photo.caption}</span>
                  <span className={styles.captionShort} aria-hidden="true">
                    {photo.short}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <DecorButton className={styles.ctaNarrow} />
      </div>
    </section>
  );
}
