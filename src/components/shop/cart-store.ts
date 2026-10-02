"use client";

import { useSyncExternalStore } from "react";
import type { StoredImage } from "@/lib/media";

// The cart lives in localStorage, so it survives reloads and needs no login.
// It only records what was picked; checkout re-prices every line on the server.

export type CartLine = {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  image: StoredImage | null;
};

const KEY = "shakha-cart-v1";
const EVENT = "shakha-cart";
const EMPTY: CartLine[] = [];
const MAX_QTY = 20;

let snapshot: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function parse(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((l) => Number.isInteger(l?.variantId) && l.quantity > 0) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function read() {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // Storage blocked (private mode, strict settings): behave as an empty cart.
  }
  if (raw !== snapshot.raw) snapshot = { raw, lines: parse(raw) };
  return snapshot.lines;
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Ignore: the cart just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export const cart = {
  add(line: Omit<CartLine, "quantity">, quantity = 1) {
    const lines = read();
    const existing = lines.find((l) => l.variantId === line.variantId);
    write(
      existing
        ? lines.map((l) =>
            l.variantId === line.variantId ? { ...l, ...line, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l,
          )
        : [...lines, { ...line, quantity: Math.min(MAX_QTY, quantity) }],
    );
  },
  setQuantity(variantId: number, quantity: number) {
    write(
      quantity <= 0
        ? read().filter((l) => l.variantId !== variantId)
        : read().map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l)),
    );
  },
  remove(variantId: number) {
    write(read().filter((l) => l.variantId !== variantId));
  },
  /** Refresh names and prices from the server's answer, keeping the same lines. */
  sync(fresh: { variantId: number; productName: string; variantName: string; unitPrice: number }[]) {
    const byId = new Map(fresh.map((f) => [f.variantId, f]));
    const lines = read();
    const next = lines.map((l) => {
      const f = byId.get(l.variantId);
      return f ? { ...l, name: f.productName, variantName: f.variantName, unitPrice: f.unitPrice } : l;
    });
    if (next.some((l, i) => l !== lines[i] && JSON.stringify(l) !== JSON.stringify(lines[i]))) write(next);
  },
  clear() {
    write(EMPTY);
  },
};

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCartCount() {
  return useCart().reduce((n, l) => n + l.quantity, 0);
}

const noop = () => () => {};

/** False during server rendering and hydration, true once the browser's cart can be read. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
