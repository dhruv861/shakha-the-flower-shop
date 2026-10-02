import { imageAction } from "@/app/admin/actions";
import type { productImages } from "@/db/schema";
import ProductImage from "../shop/ProductImage";
import styles from "./admin.module.css";
import ImageUpload from "./ImageUpload";
import SubmitButton from "./SubmitButton";

type Image = typeof productImages.$inferSelect;

export default function ImageManager({ productId, images }: { productId: number; images: Image[] }) {
  return (
    <section className={`${styles.card} ${styles.form}`}>
      <h2 className={styles.cardTitle}>Photos</h2>
      {images.length ? (
        <ul className={styles.imageGrid} role="list">
          {images.map((img, i) => (
            <li key={img.id} className={styles.imageCard}>
              <span className={styles.imageBox}>
                <ProductImage image={{ key: img.key, widths: img.widths, width: img.width, height: img.height }} alt={img.alt} sizes="200px" />
                {i === 0 && <span className={styles.coverTag}>Cover</span>}
              </span>
              <form action={imageAction} className={styles.imageAlt}>
                <input type="hidden" name="imageId" value={img.id} />
                <input type="hidden" name="op" value="alt" />
                <label className={styles.field}>
                  <span className={styles.label}>Describe the photo</span>
                  <input name="alt" className={styles.input} defaultValue={img.alt} maxLength={200} />
                </label>
                <SubmitButton className={styles.linkButton} pendingLabel="Saving…">
                  Save description
                </SubmitButton>
              </form>
              <form action={imageAction} className={styles.buttons}>
                <input type="hidden" name="imageId" value={img.id} />
                {i > 0 && (
                  <>
                    <SubmitButton name="op" value="cover" className={styles.linkButton} pendingLabel="…">
                      Make cover
                    </SubmitButton>
                    <SubmitButton name="op" value="left" className={styles.linkButton} pendingLabel="…">
                      Move earlier
                    </SubmitButton>
                  </>
                )}
                {i < images.length - 1 && (
                  <SubmitButton name="op" value="right" className={styles.linkButton} pendingLabel="…">
                    Move later
                  </SubmitButton>
                )}
                <SubmitButton name="op" value="delete" className={styles.linkButton} pendingLabel="Deleting…">
                  Delete
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.hint}>No photos yet. Products without a photo show a plain placeholder.</p>
      )}
      <ImageUpload productId={productId} />
    </section>
  );
}
