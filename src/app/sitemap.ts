import type { MetadataRoute } from "next";

// Regenerate daily at runtime instead of being a hard build-time dependency.
export const revalidate = 86400;

const BASE_URL = "https://enjoyfullife.com";

const CATEGORY_SLUGS = ["glow", "daily", "baby", "fragrances", "home-care"];

interface Product {
  slug?: string;
  _id?: string;
  isHidden?: boolean;
}

async function fetchProductSlugs(): Promise<string[]> {
  const base = process.env.NEST_API_URL ?? "http://localhost:4000/api/v1";
  // Hard timeout so a cold/slow API can NEVER hang the build (the previous build
  // failed because this fetch took >60s). On timeout we just ship the static +
  // category routes and let the next revalidation pick up product URLs.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${base}/products?limit=500&page=1`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const products: Product[] = data.data ?? data.products ?? data ?? [];
    return products
      .filter((p) => !p.isHidden)
      .map((p) => p.slug ?? p._id ?? "")
      .filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productSlugs = await fetchProductSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const productPages: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${BASE_URL}/product/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
