import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KrishiNethra AI",
  description: "Har Khet Ka AI Doctor",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} h-full`}>
      <body className="min-h-full bg-[#000000] font-sans text-[#e7f5ec] antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "#0a120c",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "#e7f5ec",
            },
          }}
        />
      </body>
    </html>
  );
}
