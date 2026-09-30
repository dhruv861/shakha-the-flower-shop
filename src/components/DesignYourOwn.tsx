import { whatsappLink } from "@/lib/site";
import { ArrowIcon } from "./Icons";
import Picture from "./Picture";
import styles from "./DesignYourOwn.module.css";

const STEPS = [
  "Pick your flowers — roses in every shade, lilies, orchids, sunflowers and seasonal exotics.",
  "Choose your wrap and ribbon.",
  "Add a teddy or chocolates to make it a gift.",
];

export default function DesignYourOwn() {
  return (
    <section className={styles.section} aria-labelledby="design-title">
      <div className={`container ${styles.inner}`}>
        <div className={`${styles.photo} frame rise`}>
          <Picture
            name="interior-vesu"
            alt="Inside Shakha's Vesu studio, with wooden counters and flower displays"
            sizes="(min-width: 1024px) 640px, 92vw"
          />
        </div>

        <div className={`${styles.copy} rise`} data-d="1">
          <span className="eyebrow">The Shakha experience</span>
          <h2 id="design-title" className="display">
            Design your <em>own</em> bouquet.
          </h2>
          <p className="lead">
            Step into Shakha, pick every stem and choose your wrap — our florists put it together while you
            watch.
          </p>
          <ol className={styles.steps} role="list">
            {STEPS.map((step, i) => (
              <li key={step}>
                <span className={styles.number} aria-hidden="true">
                  0{i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className={styles.actions}>
            <a href="#visit" className="btn btn-outline">
              Find a studio
            </a>
            <a
              href={whatsappLink("Hi Shakha! Here's my bouquet idea: ")}
              target="_blank"
              rel="noopener noreferrer"
              className={`link-arrow ${styles.whatsapp}`}
            >
              Or send your idea on WhatsApp
              <ArrowIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
