import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Regenerate daily at runtime instead of being a hard build-time dependency.
export const revalidate = 86400;

const FALLBACK_CATEGORY_SLUGS = ["glow", "daily", "baby", "fragrances", "home-care"];
const PUBLIC_STATIC_PAGES = [
  { path: "/404", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "", changeFrequency: "daily" as const, priority: 1 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/shipping-returns", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/privacy-policy", changeFrequency: "monthly" as const, priority: 0.3 },
  { path: "/terms-of-service", changeFrequency: "monthly" as const, priority: 0.3 },
];

interface Product {
  slug?: string;
  _id?: string;
  productFamily?: string;
  isHidden?: boolean;
}

interface ProductResponse {
  data?: Product[];
  products?: Product[];
  meta?: { totalPages?: number };
}

interface CategoryResponse {
  data?: Array<{ slug?: string; isActive?: boolean }>;
}

async function fetchCategorySlugs(): Promise<string[]> {
  const base = process.env.NEST_API_URL ?? "http://localhost:4000/api/v1";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${base}/categories`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`Categories API returned ${response.status}`);
    const payload = await response.json() as CategoryResponse;
    const slugs = (payload.data ?? [])
      .filter((category) => category.isActive !== false)
      .map((category) => category.slug ?? "")
      .filter(Boolean);
    return [...new Set(["all", ...slugs])];
  } catch {
    return ["all", ...FALLBACK_CATEGORY_SLUGS];
  } finally {
    clearTimeout(timer);
  }
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
      .map((p) => p.productFamily || p.slug || p._id || "")
      .filter(Boolean))];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, categorySlugs] = await Promise.all([
    fetchProductSlugs(),
    fetchCategorySlugs(),
  ]);

  const staticPages: MetadataRoute.Sitemap = PUBLIC_STATIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
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
