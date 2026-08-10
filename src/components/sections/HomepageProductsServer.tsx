import { BestSellingProducts } from "@/components/sections/BestSellingProducts";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { getHomepageProducts } from "@/lib/products-server";
import type { Product } from "@/data/products";

export async function HomepageFeaturedProductsServer() {
  let featured: Product[] = [];
  try {
    featured = (await getHomepageProducts()).featured;
  } catch (error) {
    console.error("[HomepageFeaturedProductsServer] product fetch failed", error);
  }
  return <FeaturedProducts products={featured} />;
}

export async function HomepageBestSellingProductsServer() {
  let bestSelling: Product[] = [];
  try {
    bestSelling = (await getHomepageProducts()).bestSelling;
  } catch (error) {
    console.error("[HomepageBestSellingProductsServer] product fetch failed", error);
  }
  return <BestSellingProducts products={bestSelling} />;
}
