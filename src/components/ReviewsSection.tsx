import { googleReviews } from "@/lib/site";
import { StarIcon } from "./Icons";
import styles from "./ReviewsSection.module.css";

// Verbatim five-star reviews from Shakha's Google listing (names withheld).
const REVIEWS = [
  "Best flower shop in Surat! Even for last-minute requests, they were super helpful and responsive.",
  "The best florist I have seen in Surat. Great flowers. Unique arrangements. Overall amazing.",
  "Got a small bouquet for a friend. The owner helped me out in deciding.",
];

export default function ReviewsSection() {
  return (
    <section className={styles.section} aria-labelledby="reviews-title">
      <div className="container">
        <div className={`${styles.head} rise`}>
          <span className="eyebrow">Loved in Surat</span>
          <h2 id="reviews-title" className="display">
            {googleReviews.fiveStar} five-star reviews on Google.
          </h2>
          <p className={styles.meta}>
            {googleReviews.average} average from{" "}
            <a href={googleReviews.listingUrl} target="_blank" rel="noopener noreferrer">
              {googleReviews.total} Google reviews
            </a>{" "}
            · Listed among Surat&apos;s top 3 florists by ThreeBestRated
          </p>
        </div>

        <ul className={styles.list} role="list">
          {REVIEWS.map((quote, i) => (
            <li key={quote} className="rise" data-d={i}>
              <figure className={styles.card}>
                <div className={styles.stars} role="img" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }, (_, s) => (
                    <StarIcon key={s} />
                  ))}
                </div>
                <blockquote className={styles.quote}>“{quote}”</blockquote>
                <figcaption className={styles.source}>5-star review on Google</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
