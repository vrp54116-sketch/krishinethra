import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AppToaster from "@/components/layout/AppToaster";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import DemoSeedBoot from "@/components/pwa/DemoSeedBoot";
import { AlertPipelineListener } from "@/lib/notifications";
import { AmbientBackground } from "@/components/ui/glass";
import "./globals.css";
// V2.1 liquid glass system — imported after globals so its tokens/utilities
// (e.g. --glass-blur: 20px) win the cascade over the legacy glass helpers.
import "../lib/liquid-glass.css";
// Field Editorial design system tokens and primitives
import "../lib/editorial.css";


// NOTE: next/font/google was removed — its Turbopack build-time fetch of
// fonts.gstatic.com fails in offline/blocked CI ("Can't resolve
// @vercel/turbopack-next/internal/font/google/font"). Inter is loaded at
// runtime via <link> below with a system-font fallback, so the build is
// fully offline-safe.

const SITE_TITLE = "KrishiNethra AI — Stop the guesswork. Start the growth.";
const SITE_DESCRIPTION =
  "KrishiNethra AI — Stop the guesswork. Start the growth. Har Khet Ka AI Doctor: offline-first smart farm command center with live sensors, AI agent reasoning, and edge irrigation control.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://krishinethra.vercel.app",
  ),
  title: {
    default: SITE_TITLE,
    template: "%s • KrishiNethra AI",
  },
  description: SITE_DESCRIPTION,
  applicationName: "KrishiNethra AI",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "KrishiNethra AI",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  keywords: [
    "smart farm",
    "precision agriculture",
    "edge ai",
    "ESP32",
    "MQTT",
    "irrigation",
    "KrishiNethra",
    "KrishiNethra AI",
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
    siteName: "KrishiNethra AI",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KrishiNethra AI — Stop the guesswork. Start the growth.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0F0B",
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
    <html lang="en" className="dark h-full" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Inter via runtime stylesheet (non-blocking, offline-safe fallback) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter+Tight:ital,wght@0,800;1,800&family=Inter:wght@400;500;600;700;800&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter+Tight:ital,wght@0,800;1,800&family=Inter:wght@400;500;600;700;800&display=swap"
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('krishinethra-field-theme')||localStorage.getItem('krishinethra-theme');var isLight=t==='light'||((t==='system'||!t)&&window.matchMedia('(prefers-color-scheme: light)').matches);if(isLight){document.documentElement.classList.add('light');document.documentElement.setAttribute('data-theme','light');}else{document.documentElement.classList.remove('light');document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-[var(--bg)] font-sans text-[var(--text)] antialiased">
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
