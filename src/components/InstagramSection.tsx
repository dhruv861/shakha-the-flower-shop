import { site } from "@/lib/site";
import { InstagramIcon } from "./Icons";
import Picture from "./Picture";
import type { ImageName } from "./Picture";
import styles from "./InstagramSection.module.css";

// Each tile opens its own post or reel.
const POSTS: { image: ImageName; alt: string; url: string }[] = [
  { image: "ig-jamun", alt: "Jamun bouquet post on Instagram", url: "https://www.instagram.com/p/DZUCc8LPiOi/" },
  { image: "ig-mocktail", alt: "Mocktail bouquet post on Instagram", url: "https://www.instagram.com/p/DaW-VBCT1Hk/" },
  { image: "ig-orchid", alt: "Orchid bouquet post on Instagram", url: "https://www.instagram.com/p/DZZMm4NMMmO/" },
  {
    image: "ig-laddu",
    alt: "Laddu bouquet for Ganesh Chaturthi post on Instagram",
    url: "https://www.instagram.com/p/DdIwtEDzzRC/",
  },
  {
    image: "ig-ferrero-teddy",
    alt: "Ferrero and teddy bouquet reel on Instagram",
    url: "https://www.instagram.com/p/Dahgi7psCR0/",
  },
  {
    image: "ig-white-bouquet",
    alt: "White and yellow bouquet reel on Instagram",
    url: "https://www.instagram.com/p/DUtRiNvCiko/",
  },
];

function FollowButton({ className }: { className: string }) {
  return (
    <a
      href={site.instagram.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn-outline ${className}`}
    >
      <InstagramIcon />
      Follow on Instagram
    </a>
  );
}

export default function InstagramSection() {
  return (
    <section className={styles.section} aria-labelledby="instagram-title">
      <div className="container">
        <div className={`${styles.head} rise`}>
          <div className={styles.intro}>
            <span className="eyebrow">From our Instagram</span>
            <h2 id="instagram-title" className={`display ${styles.title}`}>
              @{site.instagram.handle}
            </h2>
          </div>
          <FollowButton className={styles.followWide} />
        </div>

        <ul className={styles.grid} role="list">
          {POSTS.map((post, i) => (
            <li key={post.url} className="rise" data-d={i} data-dm={i % 3}>
              <a href={post.url} target="_blank" rel="noopener noreferrer" className={`${styles.tile} frame`}>
                <div className={styles.zoom}>
                  <Picture
                    name={post.image}
                    alt={post.alt}
                    sizes="(min-width: 1024px) 190px, (min-width: 768px) 31vw, 30vw"
                  />
                </div>
              </a>
            </li>
          ))}
        </ul>

        <FollowButton className={styles.followNarrow} />
      </div>
    </section>
  );
}
