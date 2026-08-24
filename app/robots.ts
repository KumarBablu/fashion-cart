import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
    "https://fashioncartstore.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin",
          "/atelier-studio-7k9x",
          "/api/",
          "/account/",
          "/account",
          "/checkout/",
          "/checkout",
          "/cart",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/account/",
          "/checkout/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
