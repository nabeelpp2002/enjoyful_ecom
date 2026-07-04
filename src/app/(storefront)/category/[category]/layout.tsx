import type { Metadata } from "next";
import type { ReactNode } from "react";

type CategorySlug = "glow" | "daily" | "baby" | "fragrances" | "home-care";

interface CategoryMeta {
  title: string;
  description: string;
}

const CATEGORY_META: Record<CategorySlug, CategoryMeta> = {
  glow: {
    title: "Glow Collection — Face Serums & Brightening Skincare UAE | Enjoyful Life",
    description:
      "Shop the Glow Collection — premium face serums, brightening treatments and radiance boosters crafted for UAE skin. Free delivery across UAE.",
  },
  daily: {
    title: "Daily Essentials — Everyday Skincare Routine UAE | Enjoyful Life",
    description:
      "Build your daily skincare routine with Enjoyful Life's essential moisturisers, cleansers and toners. Natural formulas for UAE & UK customers.",
  },
  baby: {
    title: "Baby Skincare — Gentle & Natural Baby Care UAE | Enjoyful Life",
    description:
      "Gentle, dermatologist-approved baby skincare. Free from parabens and harsh chemicals. Safe for sensitive newborn skin. Delivered across UAE.",
  },
  fragrances: {
    title: "Fragrances — Premium Natural Perfumes & Body Mists UAE | Enjoyful Life",
    description:
      "Discover Enjoyful Life's curated fragrance collection. Natural perfumes and body mists inspired by the UAE. Free delivery on orders over 50 AED.",
  },
  "home-care": {
    title: "Home Care — Cleaning & Household Products UAE | Enjoyful Life",
    description:
      "Shop Enjoyful Life's Home Care range. Kitchen, bathroom, laundry and floor care products. Delivered across UAE.",
  },
};

const FALLBACK_META: CategoryMeta = {
  title: "Shop All — Premium Natural Skincare UAE | Enjoyful Life",
  description:
    "Browse the full Enjoyful Life collection. Premium natural skincare for UAE and UK customers. Free delivery on orders over 50 AED.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta =
    CATEGORY_META[category as CategorySlug] ?? FALLBACK_META;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `https://enjoyfullife.com/category/${category}`,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://enjoyfullife.com/category/${category}`,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function CategoryLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const meta = CATEGORY_META[category as CategorySlug] ?? FALLBACK_META;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: meta.title,
    description: meta.description,
    url: `https://enjoyfullife.com/category/${category}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Enjoyful Life",
      url: "https://enjoyfullife.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
