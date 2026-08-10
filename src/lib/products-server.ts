import "server-only";

import { cache } from "react";
import type { Product } from "@/data/products";
import { normalizeApiProduct, type ApiProduct } from "@/lib/product-normalize";

const API_BASE = process.env.NEST_API_URL ?? "http://localhost:4000/api/v1";

export const PRODUCT_REVALIDATE_SECONDS = 300;
export const PRODUCT_CACHE_TAG = "products";

export interface ProductListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListData {
  products: Product[];
  meta: ProductListMeta;
}

export interface SizeVariant {
  _id: string;
  slug?: string;
  name: string;
  size: string;
  price: number;
  compareAtPrice?: number;
  originalPrice?: number;
  discountPct?: number;
  stock: number;
  productCode?: string;
  currency: string;
}

export interface UpstreamResult<T> {
  ok: boolean;
  status: number;
  body: T;
}

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  meta?: Partial<ProductListMeta>;
};

async function fetchProductApi<T>(path: string, tags: string[] = []): Promise<UpstreamResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      next: {
        revalidate: PRODUCT_REVALIDATE_SECONDS,
        tags: [PRODUCT_CACHE_TAG, ...tags],
      },
    });
    const body = await response.json() as T;
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchProductListEnvelope(search: string): Promise<UpstreamResult<ApiEnvelope<ApiProduct[]>>> {
  const suffix = search ? (search.startsWith("?") ? search : `?${search}`) : "";
  return fetchProductApi<ApiEnvelope<ApiProduct[]>>(`/products${suffix}`);
}

export async function getProductList(search: URLSearchParams | string): Promise<ProductListData> {
  const query = typeof search === "string" ? search : search.toString();
  const result = await fetchProductListEnvelope(query);
  if (!result.ok) throw new Error(`Products API returned ${result.status}`);

  const raw = Array.isArray(result.body?.data) ? result.body.data : [];
  const meta = result.body?.meta ?? {};
  return {
    products: raw.map(normalizeApiProduct),
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? raw.length,
      total: meta.total ?? raw.length,
      totalPages: meta.totalPages ?? 1,
    },
  };
}

type HomepageProducts = { featured: Product[]; bestSelling: Product[] };

function selectHomepageProducts(products: Product[]): HomepageProducts {
  const balanceByCategory = (list: Product[], limit: number) => {
    const byCategory = new Map<string, Product[]>();
    for (const product of list) {
      const category = product.category || "Other";
      const bucket = byCategory.get(category) ?? [];
      bucket.push(product);
      byCategory.set(category, bucket);
    }

    const buckets = Array.from(byCategory.values());
    const selected: Product[] = [];
    let index = 0;
    while (selected.length < limit && buckets.some((bucket) => bucket.length > 0)) {
      const bucket = buckets[index % buckets.length];
      const product = bucket.shift();
      if (product) selected.push(product);
      index += 1;
    }
    return selected;
  };

  const featured = balanceByCategory(products.filter((product) => product.isFeatured), 8);
  const featuredIds = new Set(featured.map((product) => product.id));
  const featuredFill = balanceByCategory(
    products.filter((product) => !featuredIds.has(product.id)),
    8 - featured.length,
  );

  const bestSelling = products.filter((product) => product.isBestSeller);
  const bestSellingIds = new Set(bestSelling.map((product) => product.id));
  const bestSellingFill = products
    .filter((product) => !bestSellingIds.has(product.id))
    .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));

  return {
    featured: [...featured, ...featuredFill],
    bestSelling: [...bestSelling, ...bestSellingFill].slice(0, 8),
  };
}

async function getHomepageProductsUncached(): Promise<HomepageProducts> {
  try {
    const result = await fetchProductApi<ApiEnvelope<{ featured: ApiProduct[]; bestSelling: ApiProduct[] }>>(
      "/products/homepage",
      ["products-homepage"],
    );
    const data = result.ok ? result.body?.data : undefined;
    const featured = (data?.featured ?? []).map(normalizeApiProduct);
    const bestSelling = (data?.bestSelling ?? []).map(normalizeApiProduct);
    if (featured.length > 0 || bestSelling.length > 0) return { featured, bestSelling };

    console.warn(`[products-server] Homepage products endpoint returned no products (${result.status}); using list fallback`);
  } catch (error) {
    console.warn("[products-server] Homepage products endpoint failed; using list fallback", error);
  }

  // Deployment-safe fallback: the frontend and Nest API can deploy at different
  // times. Keep the original curated selection available from the established
  // list endpoint, server-side only, until /products/homepage is ready.
  const fallback = await getProductList("page=1&limit=100&sort=featured");
  return selectHomepageProducts(fallback.products);
}

export const getHomepageProducts = cache(getHomepageProductsUncached);

export async function fetchProductByIdEnvelope(id: string) {
  return fetchProductApi<ApiEnvelope<ApiProduct>>(`/products/${encodeURIComponent(id)}`, [`product:${id}`]);
}

export async function fetchProductBySlugEnvelope(slug: string) {
  return fetchProductApi<ApiEnvelope<ApiProduct>>(`/products/slug/${encodeURIComponent(slug)}`, [`product:${slug}`]);
}

export async function fetchProductFamilyEnvelope(family: string) {
  return fetchProductApi<ApiEnvelope<SizeVariant[]>>(
    `/products/family/${encodeURIComponent(family)}`,
    [`product-family:${family}`],
  );
}

export interface ResolvedProduct {
  product: Product;
  rawProduct: ApiProduct;
  variants: SizeVariant[];
  relatedProducts: Product[];
}

async function resolveProductUncached(identifier: string): Promise<ResolvedProduct | null> {
  const result = await fetchProductApi<ApiEnvelope<{
    product: ApiProduct;
    variants: SizeVariant[];
    related: ApiProduct[];
  }>>(`/products/resolve/${encodeURIComponent(identifier)}`, [`product:${identifier}`]);
  const data = result.ok ? result.body?.data : null;
  if (!data?.product) return null;
  return {
    product: normalizeApiProduct(data.product),
    rawProduct: data.product,
    variants: Array.isArray(data.variants) ? data.variants : [],
    relatedProducts: (data.related ?? []).map(normalizeApiProduct),
  };
}

export const resolveProduct = cache(resolveProductUncached);

export function storefrontCacheHeaders(): Record<string, string> {
  return {
    "Cache-Control": `public, s-maxage=${PRODUCT_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
  };
}
