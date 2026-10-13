export interface StorefrontAvailability {
  isHidden?: boolean;
  isActive?: boolean;
  price?: number | null;
}

/**
 * The merchant confirms published products are stocked. Availability is managed
 * through visibility, not the legacy stock counter (which may be zero).
 * Hide/deactivate a product when it is no longer available. Never invent counts.
 */
export function isStorefrontAvailable(product: StorefrontAvailability | null | undefined): boolean {
  return Boolean(product && product.isHidden !== true && product.isActive !== false
    && typeof product.price === "number" && Number.isFinite(product.price) && product.price > 0);
}

export const IN_STOCK_SCHEMA = "https://schema.org/InStock";
