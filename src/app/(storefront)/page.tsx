import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/HeroSection";
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
    "Shop premium natural skincare in UAE and UK. Glow serums, daily essentials, baby care, fragrances and home wellness. Free delivery across UAE. Cruelty-free and dermatologist tested.",
  alternates: { canonical: "https://enjoyfullife.com" },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <ShopByCategory />
      <FeaturedProducts />
      <FeaturesSection />
      <BestSellingProducts />
      <NewsletterSection />
      <SeoContent data={SEO_CONTENT.homepage} />
    </>
  );
}
