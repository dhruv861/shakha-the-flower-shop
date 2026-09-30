"use client";

import { useEffect } from "react";
import { cart } from "./cart-store";

/** Empties the browser cart once an order has been placed. */
export default function ClearCart() {
  useEffect(() => {
    cart.clear();
  }, []);
  return null;
}
