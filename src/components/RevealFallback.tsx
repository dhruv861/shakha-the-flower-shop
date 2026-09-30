"use client";

import { useEffect } from "react";

/**
 * Scroll reveals for browsers without CSS scroll-driven animations
 * (Firefox, Safari before 26). Browsers that have them never run this: the
 * .rise rules in globals.css do the work there with no JavaScript.
 *
 * Runs after hydration, so server-rendered markup is never hidden up front;
 * anything already on screen is left alone rather than faded out and back.
 */
export default function RevealFallback() {
  useEffect(() => {
    if (CSS.supports("animation-timeline: view()")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );

    const fold = window.innerHeight * 0.92;
    for (const el of document.querySelectorAll<HTMLElement>(".rise")) {
      if (el.getBoundingClientRect().top < fold) continue;
      el.classList.add("pending");
      io.observe(el);
    }

    return () => io.disconnect();
  }, []);

  return null;
}
