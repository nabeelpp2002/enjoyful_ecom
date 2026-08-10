import "server-only";

import { revalidateTag } from "next/cache";
import { PRODUCT_CACHE_TAG } from "@/lib/products-server";

/**
 * Every public product list/detail/family fetch carries the shared products tag.
 * Invalidating it keeps category pages, homepage rows, detail pages, prices,
 * stock, visibility and promotional flags coherent after any admin mutation.
 */
export function invalidateProductCaches() {
  revalidateTag(PRODUCT_CACHE_TAG, "max");
}
