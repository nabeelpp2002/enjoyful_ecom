import type { HeroImageVariant } from "@/lib/hero-image-spec";

interface HeroSafeAreaOverlayProps {
  variant: HeroImageVariant;
  aspect: number;
}

/**
 * Safe-area guide aligned to the crop box (same aspect ratio as the hero slot).
 * Percentages mirror the live HeroSection layout.
 */
export function HeroSafeAreaOverlay({ variant, aspect }: HeroSafeAreaOverlayProps) {
  const isDesktop = variant === "desktop";

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[5]">
      <div
        className="relative h-full w-full"
        style={{ aspectRatio: aspect, maxWidth: "100%", maxHeight: "100%" }}
      >
        {isDesktop ? (
          <>
            {/* Header overlay (floating nav) */}
            <div
              className="absolute inset-x-0 top-0 border-b border-sky-400/70 bg-sky-400/15"
              style={{ height: "12%" }}
            >
              <span className="absolute left-2 top-1 text-[9px] font-semibold uppercase tracking-wide text-sky-100">
                Header overlay
              </span>
            </div>

            {/* Text / CTA safe zone */}
            <div
              className="absolute left-0 top-0 bottom-0 border-r border-dashed border-amber-300/80 bg-amber-300/10"
              style={{ width: "55%" }}
            >
              <span className="absolute left-2 top-[14%] text-[9px] font-semibold uppercase tracking-wide text-amber-100">
                Text &amp; CTA
              </span>
            </div>

            {/* Product / branding safe zone */}
            <div
              className="absolute right-0 top-0 bottom-0 border-l border-emerald-400/80 bg-emerald-400/10"
              style={{ width: "45%" }}
            >
              <span className="absolute right-2 top-[14%] text-[9px] font-semibold uppercase tracking-wide text-emerald-100 text-right">
                Product &amp; branding
              </span>
            </div>

            {/* May-crop edges */}
            <div className="absolute inset-x-0 top-[12%] h-[8%] border-y border-red-400/40 bg-red-500/5" />
            <div className="absolute inset-x-0 bottom-0 h-[8%] border-t border-red-400/40 bg-red-500/5">
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-medium uppercase tracking-wide text-red-200/90 whitespace-nowrap">
                May crop on some screens
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Mobile header */}
            <div
              className="absolute inset-x-0 top-0 border-b border-sky-400/70 bg-sky-400/15"
              style={{ height: "15%" }}
            >
              <span className="absolute left-2 top-1 text-[9px] font-semibold uppercase tracking-wide text-sky-100">
                Header overlay
              </span>
            </div>

            {/* Subject safe band */}
            <div
              className="absolute inset-x-0 border-y border-emerald-400/80 bg-emerald-400/10"
              style={{ top: "15%", bottom: "25%" }}
            >
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-semibold uppercase tracking-wide text-emerald-100 text-center">
                Subject safe
              </span>
            </div>

            {/* Text / bottom nav zone */}
            <div
              className="absolute inset-x-0 bottom-0 border-t border-amber-300/80 bg-amber-300/15"
              style={{ height: "25%" }}
            >
              <span className="absolute left-2 top-2 text-[9px] font-semibold uppercase tracking-wide text-amber-100">
                Text &amp; bottom nav
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-[25%] h-[6%] border-t border-red-400/40 bg-red-500/5">
              <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[8px] font-medium uppercase tracking-wide text-red-200/90 whitespace-nowrap">
                May crop on some screens
              </span>
            </div>
          </>
        )}

        {/* Center safe core (always visible with object-cover) */}
        <div
          className="absolute border border-white/40 border-dashed"
          style={{
            left: "15%",
            right: "15%",
            top: isDesktop ? "18%" : "20%",
            bottom: isDesktop ? "18%" : "30%",
          }}
        >
          <span className="absolute -top-4 left-0 text-[8px] font-medium uppercase tracking-wide text-white/70">
            Core safe area
          </span>
        </div>
      </div>
    </div>
  );
}
