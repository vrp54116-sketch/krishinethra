import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://krishinethra.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/app", "/app/*", "/editorial", "/offline"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
