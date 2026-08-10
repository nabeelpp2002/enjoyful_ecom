import type { Product } from "@/data/products";
import { displayName, pickProductImages } from "@/lib/utils";

export type ApiProduct = Record<string, unknown>;

export function normalizeApiProduct(p: ApiProduct): Product {
  const category = typeof p.category === "object" && p.category !== null
    ? String((p.category as { name?: unknown }).name ?? "")
    : String(p.category ?? "");
  const imagesRaw = p.images as Array<{ url?: string } | string> | undefined;
  const imageUrls = (imagesRaw ?? [])
    .map((img) => (typeof img === "string" ? img : img.url ?? ""))
    .filter(Boolean);
  const { image, hoverImage, images } = pickProductImages(
    imageUrls.length > 0
      ? imageUrls
      : [p.image as string, p.hoverImage as string].filter(Boolean),
  );

  return {
    id: String(p._id ?? p.id ?? ""),
    slug: (p.slug as string) ?? undefined,
    name: displayName(String(p.name ?? ""), p.brand as string),
    category,
    subcategory: (p.subcategory as string) ?? "",
    price: Number(p.price ?? 0),
    originalPrice: (p.originalPrice as number) ?? undefined,
    discountPct: (p.discountPct as number) ?? undefined,
    image,
    hoverImage,
    images: images.length > 0 ? images : undefined,
    rating: (p.rating as number) ?? 0,
    reviews: (p.reviews as number) ?? 0,
    description: (p.description as string) ?? "",
    benefits: (p.benefits as string[]) ?? [],
    ingredients: (p.ingredients as string[]) ?? [],
    howToUse: (p.howToUse as string) ?? "",
    skinType: (p.skinType as string[]) ?? [],
    productType: (p.productType as string) ?? "",
    tagline: (p.tagline as string) ?? undefined,
    brand: (p.brand as string) ?? undefined,
    highlights: (p.highlights as string[]) ?? undefined,
    suitableFor: (p.suitableFor as string[]) ?? undefined,
    isHidden: (p.isHidden as boolean) ?? false,
    isFeatured: (p.isFeatured as boolean) ?? false,
    onSale: (p.onSale as boolean) ?? false,
    bestDeal: (p.bestDeal as boolean) ?? false,
    isBestSeller: (p.isBestSeller as boolean) ?? false,
    externalBuyLinks: (p.externalBuyLinks as Product["externalBuyLinks"]) ?? undefined,
    size: (p.size as string) ?? undefined,
    productCode: (p.productCode as string) ?? undefined,
    productFamily: (p.productFamily as string) ?? undefined,
    variantCount: (p.variantCount as number) ?? undefined,
    activeIngredients: (p.activeIngredients as string[]) ?? undefined,
    features: (p.features as string[]) ?? undefined,
    scent: (p.scent as string) ?? undefined,
    texture: (p.texture as string) ?? undefined,
    targetUse: (p.targetUse as string) ?? undefined,
    itemForm: (p.itemForm as string) ?? undefined,
    recommendedUsage: (p.recommendedUsage as string) ?? undefined,
    precautions: (p.precautions as string) ?? undefined,
    hairType: (p.hairType as string[]) ?? undefined,
    countryOfOrigin: (p.countryOfOrigin as string) ?? undefined,
  };
}
