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
  const usable = banners.filter((b) => b.desktopImageUrl || b.mobileImageUrl);
  const normalize = (value: string) => value.toLowerCase().replace(/-/g, ' ').trim();
  const exact = usable.find((b) => normalize(b.category || "") === normCategory);
  if (exact) return exact;
  if (normCategory === "home care" || normCategory === "home") {
    return usable.find((b) => ["home", "home care"].includes(normalize(b.category || ""))) ?? null;
  }
  return null;
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
