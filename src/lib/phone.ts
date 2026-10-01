import { z } from "zod";

/**
 * An Indian mobile number typed any common way ("+91 98765 43210",
 * "098765-43210", "(91) 9876543210"), stored as its 10 digits.
 */
export const indianMobile = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s()-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"));
