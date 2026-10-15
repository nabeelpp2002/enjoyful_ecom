import type { Metadata } from "next";
import { UAE_DELIVERY_ESTIMATE, UAE_SHIPPING_COST, UAE_SHIPPING_DESCRIPTION } from "./shipping";

export const SITE_NAME = "Enjoyful Life";
export const SITE_URL = "https://www.enjoyfullife.com";
// Google recommends the lowercase domain as the final fallback when its
// automated system is not yet confident enough to select the preferred name.
export const SITE_ALTERNATE_NAMES = ["EnjoyfulLife", "enJoyful Life", "enjoyfullife.com"];
export const FOUNDER_NAME = "Aslam";
export const FOUNDER_ROLE = "Founder & CEO";
export const COMPANY_PHONE_DISPLAY = "(02) 675 1390";
export const COMPANY_PHONE_E164 = "+97126751390";
export const COMPANY_WHATSAPP_NUMBER = "97126751390";
export const COMPANY_WHATSAPP_URL = "https://wa.me/" + COMPANY_WHATSAPP_NUMBER;
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

// A global policy avoids inventing handling/transit times or a courier workweek.
export const MERCHANT_SHIPPING_POLICY = {
  "@type": "ShippingService",
  "@id": `${SITE_URL}/shipping-returns#shipping-policy`,
  name: "Standard UAE delivery",
  description: `${UAE_SHIPPING_DESCRIPTION} ${UAE_DELIVERY_ESTIMATE}`,
  fulfillmentType: "https://schema.org/FulfillmentTypeDelivery",
  shippingConditions: {
    "@type": "ShippingConditions",
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "AE" },
    shippingRate: { "@type": "MonetaryAmount", value: UAE_SHIPPING_COST, currency: "AED" },
  },
};

// Matches /shipping-returns: approved UAE returns use free courier pickup.
export const MERCHANT_RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  "@id": `${SITE_URL}/shipping-returns#return-policy`,
  applicableCountry: "AE",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 14,
  merchantReturnLink: `${SITE_URL}/shipping-returns`,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/FreeReturn",
  restockingFee: { "@type": "MonetaryAmount", value: 0, currency: "AED" },
  itemCondition: "https://schema.org/NewCondition",
};

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
