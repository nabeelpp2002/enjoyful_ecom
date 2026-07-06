// Single source of truth for valid category-banner categories.
// Must match the admin panel's CATEGORIES list in src/app/admin/banners/page.tsx (separate Next.js app, kept in sync manually).
export const CATEGORY_BANNER_CATEGORIES = ['Shop All', 'Glow', 'Baby', 'Daily', 'Fragrances', 'Home Care'] as const;

export type CategoryBannerCategory = (typeof CATEGORY_BANNER_CATEGORIES)[number];
