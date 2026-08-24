import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
    "https://fashioncartstore.vercel.app";

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/garments`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/jewellery`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/return-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const [garmentProducts, jewelleryProducts, garmentCategories, jewelleryCategories] = await Promise.all([
      getDb("garments").product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
      }).catch(() => []),
      getDb("jewellery").product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
      }).catch(() => []),
      getDb("garments").category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }).catch(() => []),
      getDb("jewellery").category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }).catch(() => []),
    ]);

    const productRoutes: MetadataRoute.Sitemap = [
      ...garmentProducts.map((p) => ({
        url: `${baseUrl}/products/${p.slug}`,
        lastModified: p.updatedAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...jewelleryProducts.map((p) => ({
        url: `${baseUrl}/products/${p.slug}?store=jewellery`,
        lastModified: p.updatedAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];

    const categoryRoutes: MetadataRoute.Sitemap = [
      ...garmentCategories.map((c) => ({
        url: `${baseUrl}/shop?category=${c.slug}`,
        lastModified: c.updatedAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...jewelleryCategories.map((c) => ({
        url: `${baseUrl}/shop?category=${c.slug}&store=jewellery`,
        lastModified: c.updatedAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];

    return [...staticRoutes, ...productRoutes, ...categoryRoutes];
  } catch {
    return staticRoutes;
  }
}
