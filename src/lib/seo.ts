import type { Metadata } from "next";

export const SITE_NAME = "Enjoyful Life";
export const SITE_URL = "https://www.enjoyfullife.com";
export const DEFAULT_OG_IMAGE = "/og/enjoyful-life-home-v2.jpg";
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;
export const DEFAULT_OG_IMAGE_ALT =
  "Enjoyful Life skincare, personal care and fragrance collection";

export const CATEGORY_OG_IMAGE = "/og/enjoyful-life-category-v2.jpg";
export const CATEGORY_OG_IMAGE_WIDTH = 1200;
export const CATEGORY_OG_IMAGE_HEIGHT = 630;
export const CATEGORY_OG_IMAGE_ALT =
  "Browse Enjoyful Life skincare, personal care and fragrance categories";

export const DEFAULT_TITLE =
  "Enjoyful Life — Skincare, Personal Care & Fragrance UAE";
export const DEFAULT_DESCRIPTION =
  "Shop Enjoyful Life skincare, body and hair care, baby care, fragrances and home care online, with delivery across the United Arab Emirates.";

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function pageMetadata({
  title,
  description,
  path,
  index = true,
  image = {
    url: DEFAULT_OG_IMAGE,
    width: DEFAULT_OG_IMAGE_WIDTH,
    height: DEFAULT_OG_IMAGE_HEIGHT,
    alt: DEFAULT_OG_IMAGE_ALT,
  },
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  image?: {
    url: string;
    width: number;
    height: number;
    alt: string;
  };
}): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, noarchive: true },
    openGraph: {
      type: "website",
      locale: "en_AE",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}
