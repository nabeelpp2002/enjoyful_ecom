import { DataProvider } from "@/context/DataContext";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  COMPANY_PHONE_E164,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  FOUNDER_NAME,
  FOUNDER_ROLE,
  MERCHANT_RETURN_POLICY,
  MERCHANT_SHIPPING_POLICY,
  SITE_ALTERNATE_NAMES,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  logo: `${SITE_URL}/assets/logoRegistered.png`,
  image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  email: "hello@enjoyfullife.com",
  telephone: COMPANY_PHONE_E164,
  hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
  hasShippingService: MERCHANT_SHIPPING_POLICY,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dubai",
    addressCountry: "AE",
  },
  areaServed: {
    "@type": "Country",
    name: "United Arab Emirates",
  },
  founder: {
    "@type": "Person",
    "@id": `${SITE_URL}/about#founder`,
    name: FOUNDER_NAME,
    jobTitle: FOUNDER_ROLE,
    url: `${SITE_URL}/about#founder`,
  },
  sameAs: [
    "https://www.instagram.com/enjoyfullife",
    "https://www.facebook.com/en.joyfullife/",
  ],
  knowsAbout: ["Skincare", "Personal care", "Baby care", "Fragrances", "Home care"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: COMPANY_PHONE_E164,
    areaServed: ["AE"],
    availableLanguage: ["English", "Arabic"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/category/all?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <ScrollToTop />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <StickyHeader />
      <main className="flex-1 w-full relative">{children}</main>
      <Footer />
      <MobileBottomNav />
    </DataProvider>
  );
}
