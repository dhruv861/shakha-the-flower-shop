import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A plain static site: `npm run build` writes everything to out/, which
  // any static host can serve (Netlify, Cloudflare Pages, Vercel, cPanel…).
  output: "export",
  experimental: {
    inlineCss: true,
  },
  images: {
    // Photos are pre-optimized by scripts/optimize-images.mjs and served
    // through <Picture>; there is no server-side optimizer in a static export.
    unoptimized: true,
  },
};

export default nextConfig;
