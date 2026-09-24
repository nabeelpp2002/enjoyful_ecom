import type { Metadata } from "next";

export const SITE_NAME = "Enjoyful Life";
export const SITE_URL = "https://www.enjoyfullife.com";
export const DEFAULT_OG_IMAGE = "/og/enjoyful-life-social.png";
export const DEFAULT_OG_IMAGE_WIDTH = 1023;
export const DEFAULT_OG_IMAGE_HEIGHT = 1537;
export const DEFAULT_OG_IMAGE_ALT =
  "Enjoyful Life Coastal Pulse body mist presented in a blue editorial campaign";

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
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
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
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: DEFAULT_OG_IMAGE_WIDTH,
          height: DEFAULT_OG_IMAGE_HEIGHT,
          alt: DEFAULT_OG_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: DEFAULT_OG_IMAGE, alt: DEFAULT_OG_IMAGE_ALT }],
    },
  };
}
