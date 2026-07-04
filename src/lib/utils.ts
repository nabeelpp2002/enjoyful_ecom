import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips the brand prefix from a product name for display. Product names are
 * stored as "Enjoyful Life <name>" with brand === "Enjoyful Life"; the storefront
 * shows the brand separately (specs grid), so we drop the redundant prefix here.
 */
export function displayName(name?: string, brand?: string): string {
  if (!name) return name ?? "";
  let n = name.trim();
  const b = (brand ?? "").trim();
  if (b && n.toLowerCase().startsWith(b.toLowerCase())) {
    n = n.slice(b.length).trim();
  }
  // Defensive: also strip a literal "Enjoyful Life" prefix even if brand is unset/different
  n = n.replace(/^enjoyful\s*life\s*/i, "").trim();
  return n || name;
}

/** True when a Cloudinary URL's final path segment ends in "21" — the thumbnail convention. */
function isThumbUrl(url: string): boolean {
  const last = (url.split("/").pop() ?? "").replace(/\.[a-z0-9]+$/i, "");
  return /21$/.test(last);
}

/**
 * Orders image URLs so the "*21" thumbnail is the primary, and derives the
 * card's primary + hover images. When a product has only one image, the single
 * image is reused for the hover so the list view never breaks.
 */
export function pickProductImages(
  urls: string[],
  fallback = "/assets/placeholder.png",
): { image: string; hoverImage: string; images: string[] } {
  const clean = urls.filter(Boolean);
  if (clean.length === 0) {
    return { image: fallback, hoverImage: fallback, images: [] };
  }
  const ordered = [...clean].sort((a, b) => {
    const a21 = isThumbUrl(a);
    const b21 = isThumbUrl(b);
    if (a21 && !b21) return -1;
    if (!a21 && b21) return 1;
    return 0; // otherwise preserve existing order
  });
  return {
    image: ordered[0],
    hoverImage: ordered[1] ?? ordered[0],
    images: ordered,
  };
}
