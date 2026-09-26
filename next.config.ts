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
  async redirects() {
    return [
      { source: "/dashboard", destination: "/app/dashboard", permanent: true },
      { source: "/dashboard/:path+", destination: "/app/dashboard/:path+", permanent: true },
      { source: "/camera", destination: "/app/camera", permanent: true },
      { source: "/camera/:path+", destination: "/app/camera/:path+", permanent: true },
      { source: "/irrigation", destination: "/app/irrigation", permanent: true },
      { source: "/irrigation/:path+", destination: "/app/irrigation/:path+", permanent: true },
      { source: "/climate", destination: "/app/climate", permanent: true },
      { source: "/climate/:path+", destination: "/app/climate/:path+", permanent: true },
      { source: "/sensors", destination: "/app/sensors", permanent: true },
      { source: "/sensors/:path+", destination: "/app/sensors/:path+", permanent: true },
      { source: "/spray", destination: "/app/spray", permanent: true },
      { source: "/spray/:path+", destination: "/app/spray/:path+", permanent: true },
      { source: "/fertilizer", destination: "/app/fertilizer", permanent: true },
      { source: "/fertilizer/:path+", destination: "/app/fertilizer/:path+", permanent: true },
      { source: "/market", destination: "/app/market", permanent: true },
      { source: "/market/:path+", destination: "/app/market/:path+", permanent: true },
      { source: "/schemes", destination: "/app/schemes", permanent: true },
      { source: "/schemes/:path+", destination: "/app/schemes/:path+", permanent: true },
      { source: "/diary", destination: "/app/diary", permanent: true },
      { source: "/diary/:path+", destination: "/app/diary/:path+", permanent: true },
      { source: "/tasks", destination: "/app/tasks", permanent: true },
      { source: "/tasks/:path+", destination: "/app/tasks/:path+", permanent: true },
      { source: "/assistant", destination: "/app/assistant", permanent: true },
      { source: "/assistant/:path+", destination: "/app/assistant/:path+", permanent: true },
      { source: "/reports", destination: "/app/reports", permanent: true },
      { source: "/reports/:path+", destination: "/app/reports/:path+", permanent: true },
      { source: "/alerts", destination: "/app/alerts", permanent: true },
      { source: "/alerts/:path+", destination: "/app/alerts/:path+", permanent: true },
      { source: "/voice", destination: "/app/voice", permanent: true },
      { source: "/voice/:path+", destination: "/app/voice/:path+", permanent: true },
      { source: "/settings", destination: "/app/settings", permanent: true },
      { source: "/settings/:path+", destination: "/app/settings/:path+", permanent: true },
      { source: "/map", destination: "/app/map", permanent: true },
      { source: "/map/:path+", destination: "/app/map/:path+", permanent: true },
      { source: "/onboarding", destination: "/app/onboarding", permanent: true },
      { source: "/onboarding/:path+", destination: "/app/onboarding/:path+", permanent: true },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
