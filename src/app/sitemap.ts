import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://krishinethra.vercel.app";
  const now = new Date();

  // Root and marketing routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/editorial`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/offline`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // App core and feature segments (/app/*)
  const appRoutes = [
    "", // /app entry
    "/dashboard",
    "/sensors",
    "/irrigation",
    "/climate",
    "/alerts",
    "/tasks",
    "/market",
    "/schemes",
    "/reports",
    "/spray",
    "/camera",
    "/assistant",
    "/diary",
    "/fertilizer",
    "/map",
    "/voice",
    "/settings",
    "/settings/diagnostics",
    "/onboarding",
  ];

  for (const segment of appRoutes) {
    routes.push({
      url: `${baseUrl}/app${segment}`,
      lastModified: now,
      changeFrequency: segment === "" || segment === "/dashboard" ? "daily" : "weekly",
      priority: segment === "" || segment === "/dashboard" ? 0.9 : 0.75,
    });
  }

  return routes;
}
