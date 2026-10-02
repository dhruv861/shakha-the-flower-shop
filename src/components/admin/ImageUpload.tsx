"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { type FormState, uploadImagesAction } from "@/app/admin/actions";
import styles from "./admin.module.css";
import SubmitButton from "./SubmitButton";

// Phone photos are often 4–10 MB, but hosted servers cap a request's size
// (Vercel at 4.5 MB). So big photos are scaled down in the browser first, and
// each photo goes up in its own request. The server still makes the final sizes.
const MAX_BYTES = 3_500_000;
const MAX_FILES = 8;
// Tried in turn until the photo is small enough; real photos pass the first.
const STEPS = [
  { side: 2400, quality: 0.88 },
  { side: 1800, quality: 0.8 },
  { side: 1440, quality: 0.72 },
];

async function shrinkForUpload(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // Not readable here; the server will say what's wrong.
  }
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= STEPS[0].side && file.size <= MAX_BYTES) return file;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return file;
    let smallest: Blob = file;
    for (const step of STEPS) {
      const scale = Math.min(1, step.side / longest);
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      context.fillStyle = "#fff"; // JPEG has no transparency
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", step.quality));
      if (jpeg && jpeg.size < smallest.size) smallest = jpeg;
      if (smallest.size <= MAX_BYTES) break;
    }
    return smallest;
  } finally {
    bitmap.close();
  }
}

export default function ImageUpload({ productId }: { productId: number }) {
  const [state, setState] = useState<FormState>({});
  const [progress, setProgress] = useState("");
  const [pending, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const files = [...(input.current?.files ?? [])];
    if (!files.length) return setState({ error: "Choose one or more photos first." });
    if (files.length > MAX_FILES) return setState({ error: `Upload up to ${MAX_FILES} photos at a time.` });

    startTransition(async () => {
      let added = 0;
      const problems: string[] = [];
      for (const [i, file] of files.entries()) {
        setProgress(files.length > 1 ? `Uploading ${i + 1} of ${files.length}…` : "Uploading…");
        const data = new FormData();
        data.set("productId", String(productId));
        data.set("images", await shrinkForUpload(file), file.name);
        const result = await uploadImagesAction({}, data).catch((): FormState => ({ error: `${file.name}: couldn't be uploaded.` }));
        if (result.error) problems.push(result.error);
        else added += 1;
      }
      const message = added ? `Added ${added} photo${added === 1 ? "" : "s"}.` : undefined;
      setState(problems.length ? { error: problems.join(" "), message } : { ok: true, message });
      setProgress("");
      form.current?.reset();
    });
  }

  return (
    <form ref={form} onSubmit={onSubmit} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>Add photos</span>
        <input ref={input} type="file" name="images" accept="image/jpeg,image/png,image/webp,image/avif" multiple className={styles.input} />
        <span className={styles.hint}>
          JPG, PNG or WebP. Big phone photos are scaled down before uploading. Portrait photos (4:5) look best.
          Location data is removed automatically.
        </span>
      </label>
      <div className={styles.buttons}>
        <SubmitButton className={`btn btn-outline ${styles.small}`} pending={pending} pendingLabel={progress || "Uploading…"}>
          Upload
        </SubmitButton>
        {!pending && state.message && <span className={styles.hint}>{state.message}</span>}
      </div>
      {!pending && state.error && <p className={styles.fieldError}>{state.error}</p>}
    </form>
  );
}
