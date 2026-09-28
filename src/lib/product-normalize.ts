import type { Product } from "@/data/products";
import { displayName, pickProductImages } from "@/lib/utils";

export type ApiProduct = Record<string, unknown>;

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeApiProduct(p: ApiProduct): Product {
  const category = typeof p.category === "object" && p.category !== null
    ? String((p.category as { name?: unknown }).name ?? "")
    : String(p.category ?? "");
  const imagesRaw = Array.isArray(p.images) ? p.images : [];
  const imageUrls = imagesRaw
    .map((img) => {
      if (typeof img === "string") return img;
      if (img && typeof img === "object" && "url" in img && typeof img.url === "string") return img.url;
      return "";
    })
    .filter(Boolean);
  const { image, hoverImage, images } = pickProductImages(
    imageUrls.length > 0
      ? imageUrls
      : [p.image as string, p.hoverImage as string].filter(Boolean),
  );
  const availableSizes = [...new Set(stringArray(p.availableSizes))];

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
    benefits: stringArray(p.benefits),
    ingredients: stringArray(p.ingredients),
    howToUse: (p.howToUse as string) ?? "",
    skinType: stringArray(p.skinType),
    productType: (p.productType as string) ?? "",
    tagline: (p.tagline as string) ?? undefined,
    brand: (p.brand as string) ?? undefined,
    highlights: stringArray(p.highlights),
    suitableFor: stringArray(p.suitableFor),
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
    availableSizes: availableSizes.length > 0 ? availableSizes : undefined,
    activeIngredients: stringArray(p.activeIngredients),
    features: stringArray(p.features),
    scent: (p.scent as string) ?? undefined,
    texture: (p.texture as string) ?? undefined,
    targetUse: (p.targetUse as string) ?? undefined,
    itemForm: (p.itemForm as string) ?? undefined,
    recommendedUsage: (p.recommendedUsage as string) ?? undefined,
    precautions: (p.precautions as string) ?? undefined,
    hairType: stringArray(p.hairType),
    countryOfOrigin: (p.countryOfOrigin as string) ?? undefined,
  };
}
