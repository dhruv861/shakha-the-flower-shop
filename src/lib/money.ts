const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Whole rupees → "₹1,299". */
export function formatPrice(rupees: number) {
  return inr.format(rupees);
}
