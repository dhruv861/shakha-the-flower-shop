import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shop and admin need a Node server (`npm run build && npm start`);
  // see README → Deploying.
  experimental: {
    inlineCss: true,
    serverActions: {
      // Product photo uploads from the admin panel (15 MB per photo max).
      bodySizeLimit: "25mb",
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
