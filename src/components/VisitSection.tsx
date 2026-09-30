import { branches } from "@/lib/site";
import { ArrowIcon, ClockIcon, PhoneIcon, PinIcon } from "./Icons";
import Picture from "./Picture";
import styles from "./VisitSection.module.css";

export default function VisitSection() {
  return (
    <section id="visit" className={styles.section} aria-labelledby="visit-title">
      <div className="container">
        <div className={styles.head}>
          <div className={`${styles.intro} rise`}>
            <span className="eyebrow">Visit us</span>
            <h2 id="visit-title" className="display">
              Two studios in Surat.
            </h2>
          </div>
          <p className={`lead ${styles.headText} rise`} data-d="1">
            Walk in to design your own bouquet, or pick up an order on your way.
          </p>
        </div>

        <div className={styles.body}>
          <div className={`${styles.photo} frame rise`}>
            <Picture
              name="storefront-vesu-16x9"
              alt="Shakha's flagship storefront on Vesu Canal Road, Surat, with its SHAKHA The Flower Shop sign"
              sizes="(min-width: 1024px) 620px, 92vw"
            />
          </div>

          <ul className={`${styles.branches} rise`} data-d="1" role="list">
            {branches.map((branch) => (
              <li key={branch.id} className={styles.branch}>
                <div className={styles.branchHead}>
                  <h3 className={styles.branchName}>{branch.name}</h3>
                  {branch.badge && <span className={styles.badge}>{branch.badge}</span>}
                </div>
                <div className={styles.lines}>
                  <p className={styles.line}>
                    <PinIcon />
                    {branch.addressLine}
                  </p>
                  <p className={styles.line}>
                    <ClockIcon />
                    {branch.hours}
                  </p>
                  <a href={branch.phone.href} className={styles.line}>
                    <PhoneIcon />
                    <span>
                      <span className="sr-only">Call {branch.name}: </span>
                      {branch.phone.display}
                    </span>
                  </a>
                </div>
                <a href={branch.mapsUrl} target="_blank" rel="noopener noreferrer" className="link-arrow">
                  Get directions<span className="sr-only"> to {branch.name}</span>
                  <ArrowIcon />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
