import CategoryPageClient from "./CategoryPageClient";
import { getProductList } from "@/lib/products-server";
import { getCategoryBanner, type CategoryBanner } from "@/lib/banners-server";
import type { Product } from "@/data/products";

const PAGE_SIZE = 16;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string; subcategory?: string }>;
}) {
  const [{ category: categoryParam }, query] = await Promise.all([params, searchParams]);
  const decodedCategory = decodeURIComponent(categoryParam);
  const requestParams = new URLSearchParams({
    page: "1",
    limit: String(PAGE_SIZE),
    sort: "featured",
  });

  if (!decodedCategory.toLowerCase().includes("all")) {
    requestParams.set("category", decodedCategory.toLowerCase().replace(/\s+/g, "-"));
  }
  if (query.subcategory) requestParams.set("subcategory", query.subcategory);
  if (query.q) requestParams.set("q", query.q);

  let initialProducts: Product[] = [];
  let initialMeta = { total: 0, totalPages: 1 };
  let initialBanner: CategoryBanner | null = null;

  try {
    const [result, banner] = await Promise.all([
      getProductList(requestParams),
      getCategoryBanner(decodedCategory),
    ]);
    initialProducts = result.products;
    initialMeta = { total: result.meta.total, totalPages: result.meta.totalPages };
    initialBanner = banner;
  } catch (error) {
    console.error("[CategoryPage] initial fetch failed", error);
  }

  const requestKey = requestParams.toString();
  return (
    <CategoryPageClient
      key={`${categoryParam}:${requestKey}`}
      categoryParam={categoryParam}
      initialProducts={initialProducts}
      initialMeta={initialMeta}
      initialRequestKey={requestKey}
      initialBanner={initialBanner}
    />
  );
}
