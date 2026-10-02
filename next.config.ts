import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shop and admin need a Node server or Vercel; see README → Deploying.
  experimental: {
    inlineCss: true,
    serverActions: {
      // Admin photo uploads: the browser scales photos to ≤ 3.5 MB and sends
      // them one at a time, which also fits Vercel's 4.5 MB request cap.
      bodySizeLimit: "5mb",
    },
  },
  images: {
    // Site photos are pre-optimized by scripts/optimize-images.mjs and uploads
    // by src/lib/image-store.ts; next/image isn't used.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Content-hashed filenames: safe to cache for a year.
        source: "/img/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
