/** Hero carousel image specifications (storefront display uses object-fit: cover in 100svh). */

export const HERO_DESKTOP_ASPECT = 16 / 9;
export const HERO_MOBILE_ASPECT = 3 / 4;

export const HERO_DESKTOP_SIZE = { width: 1920, height: 1080 };
export const HERO_MOBILE_SIZE = { width: 1200, height: 1600 };

const ASPECT_TOLERANCE = 0.015; // 1.5%
const SIZE_TOLERANCE_PX = 4;

export type HeroImageVariant = "desktop" | "mobile";

export function getHeroAspect(variant: HeroImageVariant): number {
  return variant === "desktop" ? HERO_DESKTOP_ASPECT : HERO_MOBILE_ASPECT;
}

export function getHeroStandardSize(variant: HeroImageVariant) {
  return variant === "desktop" ? HERO_DESKTOP_SIZE : HERO_MOBILE_SIZE;
}

export function aspectMatches(
  width: number,
  height: number,
  targetAspect: number,
  tolerance = ASPECT_TOLERANCE,
): boolean {
  if (width <= 0 || height <= 0) return false;
  const actual = width / height;
  return Math.abs(actual - targetAspect) / targetAspect <= tolerance;
}

export function matchesStandardSize(
  width: number,
  height: number,
  variant: HeroImageVariant,
  tolerancePx = SIZE_TOLERANCE_PX,
): boolean {
  const target = getHeroStandardSize(variant);
  return (
    Math.abs(width - target.width) <= tolerancePx &&
    Math.abs(height - target.height) <= tolerancePx
  );
}

/** Skip the crop editor when the file already matches hero specs. */
export function shouldSkipHeroCrop(
  variant: HeroImageVariant,
  width: number,
  height: number,
): boolean {
  return (
    matchesStandardSize(width, height, variant) ||
    aspectMatches(width, height, getHeroAspect(variant))
  );
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions"));
    };
    img.src = url;
  });
}

export function formatHeroSpecLabel(variant: HeroImageVariant): string {
  const size = getHeroStandardSize(variant);
  const ratio = variant === "desktop" ? "16:9" : "3:4";
  return `${size.width}×${size.height} · ${ratio}`;
}
