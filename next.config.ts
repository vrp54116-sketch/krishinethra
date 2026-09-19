import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin Turbopack's filesystem root to this project so a stray
  // package-lock.json in a parent home directory is never scanned.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
