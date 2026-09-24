import { DataProvider } from "@/context/DataContext";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  logo: `${SITE_URL}/assets/Enjoyful_logo_transparent.png`,
  image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  email: "hello@enjoyfullife.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dubai",
    addressCountry: "AE",
  },
  areaServed: {
    "@type": "Country",
    name: "United Arab Emirates",
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "areaServed": ["AE"],
    "availableLanguage": ["English", "Arabic"]
  }
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${SITE_URL}/category/all?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <ScrollToTop />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      {/* <TopOfferBar /> */}
      <StickyHeader />
      <main className="flex-1 w-full relative">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </DataProvider>
  );
}
