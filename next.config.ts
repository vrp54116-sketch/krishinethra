import type { NextConfig } from "next";
import path from "node:path";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Pin Turbopack's filesystem root to this project so a stray
  // package-lock.json in a parent home directory is never scanned.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Webcam snapshots are data URLs; keep remote formats modern + lean.
    formats: ["image/avif", "image/webp"],
  },
};

export default withBundleAnalyzer(nextConfig);
