"use client";

import { useEffect, useMemo, useState } from "react";
import { priceCartAction, type PricedCart } from "@/app/(store)/actions";
import { cart, type CartLine } from "./cart-store";

/**
 * Asks the server for current prices whenever the cart's contents change,
 * and quietly updates stale names/prices kept in the browser.
 */
export function useLivePrices(lines: CartLine[], enabled: boolean, fulfillment: "delivery" | "pickup" = "delivery") {
  const key = useMemo(
    () => JSON.stringify([fulfillment, lines.map((l) => [l.variantId, l.quantity])]),
    [lines, fulfillment],
  );
  const [result, setResult] = useState<{ key: string; data: PricedCart } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const [mode, pairs] = JSON.parse(key) as ["delivery" | "pickup", [number, number][]];
    if (!pairs.length) return;
    let cancelled = false;
    priceCartAction(
      pairs.map(([variantId, quantity]) => ({ variantId, quantity })),
      mode,
    ).then((data) => {
      if (cancelled) return;
      setResult({ key, data });
      cart.sync(data.lines);
    });
    return () => {
      cancelled = true;
    };
  }, [key, enabled]);

  const fresh = result?.key === key ? result.data : null;
  const issues = new Map((fresh?.issues ?? []).map((i) => [i.variantId, i.message]));
  const localSubtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  return { priced: fresh, issues, subtotal: fresh?.subtotal ?? localSubtotal, loading: enabled && !fresh };
}
