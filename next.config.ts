
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/collections/:slug",
        destination: "/products?collection=:slug",
      },
    ];
  },

  turbopack: {
    // Pin the root to this app.
    root: path.join(__dirname),
  },
};

export default nextConfig;
