export interface ExternalBuyLink {
    url: string;
    visible: boolean;
}

export interface ExternalBuyLinks {
    amazon?: ExternalBuyLink;
    talabat?: ExternalBuyLink;
    carrefour?: ExternalBuyLink;
}

export interface Product {
    id: string;
    slug?: string;
    name: string;
    category: string;
    subcategory: string;
    price: number;
    originalPrice?: number;
    discountPct?: number;
    image: string;
    hoverImage: string;
    images?: string[];
    rating: number;
    reviews: number;
    description: string;
    benefits: string[];
    ingredients: string[];
    howToUse: string;
    skinType?: string[];
    productType?: string;
    tagline?: string;
    brand?: string;
    highlights?: string[];
    suitableFor?: string[];
    isHidden?: boolean;
    isFeatured?: boolean;
    onSale?: boolean;
    bestDeal?: boolean;
    externalBuyLinks?: ExternalBuyLinks;
    // Variant / family fields
    size?: string;
    productCode?: string;
    productFamily?: string;
    variantCount?: number;
    // Rich catalog fields
    activeIngredients?: string[];
    features?: string[];
    scent?: string;
    texture?: string;
    targetUse?: string;
    itemForm?: string;
    recommendedUsage?: string;
    precautions?: string;
    hairType?: string[];
    countryOfOrigin?: string;
}

export const products: Product[] = [];
