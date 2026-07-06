import { memo } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_CURRENCY, formatPrice, isDiscounted } from "@/lib/price";

interface PriceProps {
    /** Selling price. When invalid (0/null/undefined/NaN) nothing is rendered. */
    amount?: number | null;
    /** Compare-at / original price. Only shown struck through when it's a real discount. */
    originalAmount?: number | null;
    currency?: string;
    /** Strikethrough beside the price ("inline", default) or below it ("stacked"). */
    layout?: "inline" | "stacked";
    /**
     * When true (default) and the price is invalid, render an empty element that
     * still reserves vertical space so product grids stay aligned. When false,
     * render nothing at all.
     */
    reserveSpace?: boolean;
    className?: string;
    amountClassName?: string;
    currencyClassName?: string;
    originalClassName?: string;
}

/**
 * The single price-rendering primitive for the customer-facing storefront.
 * Owns the "never show an invalid price" rule via the src/lib/price helpers so
 * no call site re-implements it. Callers still control the outer global
 * "Hide Prices" gate (showProductPrices) and all typography via *ClassName props.
 */
export const Price = memo(function Price({
    amount,
    originalAmount,
    currency = DEFAULT_CURRENCY,
    layout = "inline",
    reserveSpace = true,
    className,
    amountClassName,
    currencyClassName,
    originalClassName,
}: PriceProps) {
    const formatted = formatPrice(amount);

    // No valid price → blank, but optionally keep the row's height so cards align.
    if (formatted === null) {
        return reserveSpace ? <div className={cn("min-h-[1.5em]", className)} aria-hidden /> : null;
    }

    const formattedOriginal = isDiscounted(amount, originalAmount) ? formatPrice(originalAmount) : null;

    return (
        <div
            className={cn(
                "flex",
                layout === "stacked" ? "flex-col items-end gap-1" : "items-baseline gap-2",
                className,
            )}
        >
            <span className="flex items-baseline gap-1">
                <span className={amountClassName}>{formatted}</span>
                <span className={currencyClassName}>{currency}</span>
            </span>
            {formattedOriginal !== null && (
                <span className={cn("line-through", originalClassName)}>
                    {formattedOriginal} {currency}
                </span>
            )}
        </div>
    );
});
