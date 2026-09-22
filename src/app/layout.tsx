import type { Metadata, Viewport } from "next";
import AppToaster from "@/components/layout/AppToaster";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import DemoSeedBoot from "@/components/pwa/DemoSeedBoot";
import { AlertPipelineListener } from "@/lib/notifications";
import { AmbientBackground } from "@/components/ui/glass";
import "./globals.css";

// NOTE: next/font/google was removed — its Turbopack build-time fetch of
// fonts.gstatic.com fails in offline/blocked CI ("Can't resolve
// @vercel/turbopack-next/internal/font/google/font"). Inter is loaded at
// runtime via <link> below with a system-font fallback, so the build is
// fully offline-safe.

export const metadata: Metadata = {
  title: {
    default: "KrishiNethra AI",
    template: "%s • KrishiNethra AI",
  },
  description:
    "Har Khet Ka AI Doctor — offline-first smart farm command center: live sensors, crop doctor, irrigation, weather, market and AI tasks.",
  applicationName: "KrishiNethra AI",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "KrishiNethra",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "KrishiNethra AI",
    description: "Har Khet Ka AI Doctor — offline-first smart farm command center.",
    siteName: "KrishiNethra AI",
    type: "website",
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
        <AmbientBackground />
        {children}
        <AppToaster />
        <AlertPipelineListener />
        <ServiceWorkerRegister />
        <DemoSeedBoot />
      </body>
    </html>
  );
}
