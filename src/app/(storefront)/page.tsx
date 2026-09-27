import type { Metadata } from "next";
import { HeroSectionServer } from "@/components/sections/HeroSectionServer";
import { ShopByCategory } from "@/components/sections/ShopByCategory";
import {
  HomepageBestSellingProductsServer,
  HomepageFeaturedProductsServer,
} from "@/components/sections/HomepageProductsServer";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { SkinDeservesSection } from "@/components/sections/SkinDeservesSection";
import { SeoContent } from "@/components/sections/SeoContent";
import { SEO_CONTENT } from "@/data/seo-content";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, pageMetadata } from "@/lib/seo";

// Product rows depend on the live catalog. Do not cache an empty homepage when
// the catalog API is briefly unavailable during a build or revalidation.
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <>
      <HeroSectionServer />
      <ShopByCategory />
      <HomepageFeaturedProductsServer />
      <SkinDeservesSection />
      <HomepageBestSellingProductsServer />
      <FeaturesSection />
      <SeoContent data={SEO_CONTENT.homepage} />
    </>
  );
}
