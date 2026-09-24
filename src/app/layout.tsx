import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AppToaster from "@/components/layout/AppToaster";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import DemoSeedBoot from "@/components/pwa/DemoSeedBoot";
import { AlertPipelineListener } from "@/lib/notifications";
import { AmbientBackground } from "@/components/ui/glass";
import { LiquidFilterDefs } from "@/components/ui/glass/LiquidFilterDefs";
import "./globals.css";
// V2.1 liquid glass system — imported after globals so its tokens/utilities
// (e.g. --glass-blur: 20px) win the cascade over the legacy glass helpers.
import "../lib/liquid-glass.css";

// NOTE: next/font/google was removed — its Turbopack build-time fetch of
// fonts.gstatic.com fails in offline/blocked CI ("Can't resolve
// @vercel/turbopack-next/internal/font/google/font"). Inter is loaded at
// runtime via <link> below with a system-font fallback, so the build is
// fully offline-safe.

const SITE_TITLE = "KrishiNethra AI v2 — Liquid Glass Smart Farm";
const SITE_DESCRIPTION =
  "KrishiNethra AI v2 liquid glass edition — Har Khet Ka AI Doctor: offline-first smart farm command center with live sensors, AI agent reasoning, irrigation, weather, market and ESP32 MQTT edge control from anywhere.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://krishinethra.vercel.app",
  ),
  title: {
    default: SITE_TITLE,
    template: "%s • KrishiNethra AI v2",
  },
  description: SITE_DESCRIPTION,
  applicationName: "KrishiNethra AI",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "KrishiNethra",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  keywords: [
    "smart farm",
    "precision agriculture",
    "liquid glass",
    "ESP32",
    "MQTT",
    "irrigation",
    "KrishiNethra",
  ],
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "KrishiNethra AI v2",
    type: "website",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "KrishiNethra AI v2 liquid glass smart farm",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#070B09",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        {/* Inter via runtime stylesheet (non-blocking, offline-safe fallback) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Legacy iOS PWA tags for older Safari versions */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="KrishiNethra" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="h-full bg-[#070B09] font-sans text-[#F3F4F6] antialiased overflow-hidden">
        <LiquidFilterDefs />
        <AmbientBackground />
        {children}
        <AppToaster />
        <AlertPipelineListener />
        <ServiceWorkerRegister />
        <DemoSeedBoot />
        {/* Vercel Web Vitals + Speed Insights (only on Vercel — the scripts
            404 locally and would log console errors on self-hosted builds) */}
        {process.env.VERCEL ? <Analytics /> : null}
        {process.env.VERCEL ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
