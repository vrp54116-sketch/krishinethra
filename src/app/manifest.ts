import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KrishiNethra AI",
    short_name: "KrishiNethra AI",
    description:
      "Har Khet Ka AI Doctor — sovereign smart farm command center with live sensors, AI agent reasoning, irrigation and ESP32 edge control.",
    start_url: "/app/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0F0B",
    theme_color: "#0A0F0B",
    categories: ["agriculture", "productivity", "utilities"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
