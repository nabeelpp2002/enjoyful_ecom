import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroSectionServer } from "@/components/sections/HeroSectionServer";
import { ShopByCategory } from "@/components/sections/ShopByCategory";
import {
  HomepageBestSellingProductsServer,
  HomepageFeaturedProductsServer,
} from "@/components/sections/HomepageProductsServer";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { SeoContent } from "@/components/sections/SeoContent";
import { SEO_CONTENT } from "@/data/seo-content";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <>
      <Suspense fallback={<section className="relative w-full h-[100svh] bg-[var(--color-brand-onyx)] animate-pulse" />}>
        <HeroSectionServer />
      </Suspense>
      <ShopByCategory />
      <HomepageFeaturedProductsServer />
      <FeaturesSection />
      <HomepageBestSellingProductsServer />
      <NewsletterSection />
      <SeoContent data={SEO_CONTENT.homepage} />
    </>
  );
}
