import defaultBanners from "@/data/cms/banners.json";

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export interface CategoryBanner {
  id?: string;
  category: string;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
}

export function findMatchingBanner(banners: CategoryBanner[], category: string): CategoryBanner | null {
  const normCategory = category.toLowerCase().replace(/-/g, ' ').trim();
  const match = banners.find((b) => {
    const cat = (b.category || "").toLowerCase().replace(/-/g, ' ').trim();
    if (cat === normCategory) return true;
    if ((normCategory === "home care" || normCategory === "home") && (cat === "home" || cat === "home care")) return true;
    return false;
  });
  return match ?? null;
}

export async function getCategoryBanner(category: string): Promise<CategoryBanner | null> {
  const fallbackMatch = findMatchingBanner(defaultBanners as CategoryBanner[], category);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE}/category-banners`, {
      signal: controller.signal,
      next: { revalidate: 300, tags: ['category-banners'] },
    });
    clearTimeout(timer);

    if (res.ok) {
      const body = await res.json();
      const list: CategoryBanner[] = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      const apiMatch = findMatchingBanner(list, category);
      if (apiMatch) return apiMatch;
    }
  } catch {
    // API failed or timed out — fallback to static banners.json match
  }

  return fallbackMatch;
}
