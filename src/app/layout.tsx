import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import AppToaster from "@/components/layout/AppToaster";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import DemoSeedBoot from "@/components/pwa/DemoSeedBoot";
import { AlertPipelineListener } from "@/lib/notifications";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
  themeColor: "#000000",
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
    <html lang="en" className={`dark ${inter.variable} h-full`}>
      <head>
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
      <body className="min-h-full bg-[#000000] font-sans text-[#e7f5ec] antialiased">
        {children}
        <AppToaster />
        <AlertPipelineListener />
        <ServiceWorkerRegister />
        <DemoSeedBoot />
      </body>
    </html>
  );
}
