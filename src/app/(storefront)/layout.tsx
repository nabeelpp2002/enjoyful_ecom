import { DataProvider } from "@/context/DataContext";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { TopOfferBar } from "@/components/layout/TopOfferBar";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { ReactNode } from "react";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Enjoyful Life",
  "url": "https://enjoyfullife.com",
  "logo": "https://enjoyfullife.com/enjoyfullogo.png",
  "sameAs": [
    "https://www.instagram.com/enjoyfullife",
    "https://www.facebook.com/enjoyfullife"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "areaServed": ["AE", "GB"],
    "availableLanguage": ["English", "Arabic"]
  }
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Enjoyful Life",
  "url": "https://enjoyfullife.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://enjoyfullife.com/category/all?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <ScrollToTop />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
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
