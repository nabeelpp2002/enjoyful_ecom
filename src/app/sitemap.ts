import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Regenerate daily at runtime instead of being a hard build-time dependency.
export const revalidate = 86400;

const CATEGORY_SLUGS = ["all", "glow", "daily", "baby", "fragrances", "home-care"];

interface Product {
  slug?: string;
  _id?: string;
  isHidden?: boolean;
}

interface ProductResponse {
  data?: Product[];
  products?: Product[];
  meta?: { totalPages?: number };
}

async function fetchProductSlugs(): Promise<string[]> {
  const base = process.env.NEST_API_URL ?? "http://localhost:4000/api/v1";
  // Hard timeout so a cold/slow API can NEVER hang the build (the previous build
  // failed because this fetch took >60s). On timeout we just ship the static +
  // category routes and let the next revalidation pick up product URLs.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const fetchPage = async (page: number): Promise<ProductResponse> => {
      const res = await fetch(`${base}/products?limit=100&page=${page}`, {
        signal: controller.signal,
        next: { revalidate: 3600 },
      });
      if (!res.ok) throw new Error(`Products API returned ${res.status}`);
      return res.json() as Promise<ProductResponse>;
    };

    const firstPage = await fetchPage(1);
    const totalPages = Math.max(1, firstPage.meta?.totalPages ?? 1);
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2)),
    );
    const payloads = [firstPage, ...remainingPages];
    const products = payloads.flatMap((data) => data.data ?? data.products ?? []);

    return [...new Set(products
      .filter((p) => !p.isHidden)
      .map((p) => p.slug ?? p._id ?? "")
      .filter(Boolean))];
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
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...["faq", "shipping-returns", "privacy-policy", "terms-of-service"].map(
      (path) => ({
        url: `${SITE_URL}/${path}`,
        changeFrequency: "monthly" as const,
        priority: path === "faq" || path === "shipping-returns" ? 0.6 : 0.3,
      }),
    ),
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${SITE_URL}/category/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const productPages: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${SITE_URL}/product/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
