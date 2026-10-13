import { isStorefrontAvailable, type StorefrontAvailability } from "@/lib/product-availability";

export function ProductAvailability({ product }: { product: StorefrontAvailability }) {
  if (!isStorefrontAvailable(product)) return null;

  return (
    <p className="editorial-body my-2 flex items-center gap-1.5 text-xs font-medium text-emerald-800">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
      In stock
    </p>
  );
}
