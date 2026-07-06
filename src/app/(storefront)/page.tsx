import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroSectionServer } from "@/components/sections/HeroSectionServer";
import { ShopByCategory } from "@/components/sections/ShopByCategory";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { BestSellingProducts } from "@/components/sections/BestSellingProducts";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { SeoContent } from "@/components/sections/SeoContent";
import { SEO_CONTENT } from "@/data/seo-content";
export const metadata: Metadata = {
  title: "Enjoyful Life — Premium Natural Skincare UAE | Free UAE Delivery",
  description:
    "Shop premium natural skincare in the UAE. Glow serums, daily essentials, baby care, fragrances and home wellness. Free delivery across UAE. Cruelty-free and dermatologist tested.",
  alternates: { canonical: "https://enjoyfullife.com" },
};

export default function Home() {
  return (
    <>
      <Suspense fallback={<section className="relative w-full h-[100svh] bg-[var(--color-brand-onyx)] animate-pulse" />}>
        <HeroSectionServer />
      </Suspense>
      <ShopByCategory />
      <FeaturedProducts />
      <FeaturesSection />
      <BestSellingProducts />
      <NewsletterSection />
      <SeoContent data={SEO_CONTENT.homepage} />
    </>
  );
}
