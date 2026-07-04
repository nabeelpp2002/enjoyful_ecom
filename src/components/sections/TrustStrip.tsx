export function TrustStrip() {
  return (
    <div className="bg-[var(--color-brand-onyx)] w-full overflow-x-auto">
      <div className="flex items-center justify-center gap-6 sm:gap-12 px-4 py-2.5 min-w-max mx-auto">
        <span className="flex items-center gap-1.5 font-sans text-xs text-white/90 font-medium whitespace-nowrap">
          🌿 Natural Ingredients
        </span>
        <span className="flex items-center gap-1.5 font-sans text-xs text-white/90 font-medium whitespace-nowrap">
          🐰 Cruelty-Free
        </span>
        <span className="flex items-center gap-1.5 font-sans text-xs text-white/90 font-medium whitespace-nowrap">
          🚚 Free UAE Delivery
        </span>
        <span className="flex items-center gap-1.5 font-sans text-xs text-white/90 font-medium whitespace-nowrap">
          ✓ Dermatologist Tested
        </span>
      </div>
    </div>
  );
}
