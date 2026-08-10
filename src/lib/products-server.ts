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

async function getHomepageProductsUncached(): Promise<{ featured: Product[]; bestSelling: Product[] }> {
  const result = await fetchProductApi<ApiEnvelope<{ featured: ApiProduct[]; bestSelling: ApiProduct[] }>>(
    "/products/homepage",
    ["products-homepage"],
  );
  if (!result.ok) throw new Error(`Homepage products API returned ${result.status}`);
  const data = result.body?.data;
  return {
    featured: (data?.featured ?? []).map(normalizeApiProduct),
    bestSelling: (data?.bestSelling ?? []).map(normalizeApiProduct),
  };
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
