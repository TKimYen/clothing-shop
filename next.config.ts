import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // The parent folder (Clothing-Online/) has its own package.json +
    // package-lock.json (only for the Prisma CLI skills), which made Next
    // guess the wrong workspace root. Pin the root to this app.
    root: path.join(__dirname),
  },
};

export default nextConfig;
