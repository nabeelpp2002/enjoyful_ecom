import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";

type CategorySlug = "glow" | "daily" | "baby" | "fragrances" | "home-care";

interface CategoryMeta {
  title: string;
  description: string;
}

const CATEGORY_META: Record<CategorySlug, CategoryMeta> = {
  glow: {
    title: "Glow Face Care & Skincare | Enjoyful Life UAE",
    description:
      "Shop Enjoyful Life facial cleansers, scrubs, moisturisers and skincare essentials online with delivery across the UAE.",
  },
  daily: {
    title: "Daily Body & Hair Care Essentials | Enjoyful Life UAE",
    description:
      "Explore Enjoyful Life body lotions, shower gels, shampoos and everyday personal-care essentials, available for delivery across the UAE.",
  },
  baby: {
    title: "Baby Care Products | Enjoyful Life UAE",
    description:
      "Explore Enjoyful Life baby lotion, powder and everyday baby-care products online, with delivery across the UAE.",
  },
  fragrances: {
    title: "Fragrances, Perfumes & Body Mists | Enjoyful Life UAE",
    description:
      "Discover Enjoyful Life perfumes, roll-ons and body mists for women and men, available online across the UAE.",
  },
  "home-care": {
    title: "Home Care & Household Essentials | Enjoyful Life UAE",
    description:
      "Shop Enjoyful Life's Home Care range. Kitchen, bathroom, laundry and floor care products. Delivered across UAE.",
  },
};

const FALLBACK_META: CategoryMeta = {
  title: "Shop All Products | Enjoyful Life UAE",
  description:
    "Browse Enjoyful Life skincare, personal care, baby care, fragrances and home-care products, with delivery across the UAE.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta =
    CATEGORY_META[category as CategorySlug] ?? FALLBACK_META;

  return pageMetadata({
    title: meta.title,
    description: meta.description,
    path: `/category/${category}`,
  });
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
    url: `${SITE_URL}/category/${category}`,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: meta.title.split("|")[0].trim(),
        item: `${SITE_URL}/category/${category}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[jsonLd, breadcrumbJsonLd]} />
      {children}
    </>
  );
}
