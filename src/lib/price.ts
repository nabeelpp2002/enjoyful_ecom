/**
 * Single source of truth for price validity + formatting across the storefront.
 *
 * A product's `price` is typed as a required `number` but at runtime can be the
 * "unconfigured" sentinel `0` (admin coerces a blank price field to 0), or
 * null/undefined/NaN from the API. Nothing customer-facing may ever render those
 * as "0", "0 AED", or "AED 0" — every price display routes through these helpers
 * (and the <Price> component that wraps them) so the rule lives in exactly one place.
 *
 * This is orthogonal to the global admin "Hide Prices" toggle
 * (DataContext.showProductPrices), which hides ALL prices site-wide. That gate
 * stays where it is; these helpers only decide whether an individual value is
 * a real, displayable price.
 */

export const DEFAULT_CURRENCY = "AED";

/** A price is displayable only if it's a finite number strictly greater than 0. */
export function hasValidPrice(value?: number | null): value is number {
    return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Format a valid amount for display: integers stay integer, decimals are trimmed
 * to at most 2 places with no trailing zeros. Returns `null` for any invalid price
 * so callers can decide to render nothing rather than a placeholder.
 */
export function formatPrice(value?: number | null): string | null {
    if (!hasValidPrice(value)) return null;
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

/**
 * True only when BOTH prices are valid and the original is strictly higher than
 * the selling price — i.e. a genuine discount worth showing struck through.
 */
export function isDiscounted(price?: number | null, originalPrice?: number | null): boolean {
    return hasValidPrice(price) && hasValidPrice(originalPrice) && (originalPrice as number) > (price as number);
}
