import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
class ProductImage {
  @Prop({ required: true }) url: string;
  @Prop() publicId: string;
  @Prop() alt: string;
  @Prop({ default: false }) isPrimary: boolean;
}
const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

@Schema({ _id: false })
class ExternalBuyLink {
  @Prop({ default: '' }) url: string;
  @Prop({ default: true }) visible: boolean;
}
const ExternalBuyLinkSchema = SchemaFactory.createForClass(ExternalBuyLink);

@Schema({ _id: false })
class ExternalBuyLinks {
  @Prop({ type: ExternalBuyLinkSchema, default: () => ({}) }) amazon: ExternalBuyLink;
  @Prop({ type: ExternalBuyLinkSchema, default: () => ({}) }) talabat: ExternalBuyLink;
  @Prop({ type: ExternalBuyLinkSchema, default: () => ({}) }) carrefour: ExternalBuyLink;
}
const ExternalBuyLinksSchema = SchemaFactory.createForClass(ExternalBuyLinks);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ required: true, unique: true, lowercase: true }) slug: string;
  @Prop() description: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop() subcategory: string;
  @Prop() productType: string;

  @Prop({ required: true, min: 0 }) price: number;
  @Prop({ min: 0 }) compareAtPrice: number;
  @Prop({ enum: ['AED', 'GBP'], default: 'AED' }) currency: string;

  @Prop({ type: [ProductImageSchema], default: [] }) images: ProductImage[];
  @Prop() image: string;
  @Prop() hoverImage: string;

  @Prop({ default: 0, min: 0, max: 5 }) rating: number;
  @Prop({ default: 0 }) reviews: number;

  @Prop({ type: [String], default: [] }) benefits: string[];
  @Prop({ type: [String], default: [] }) ingredients: string[];
  @Prop() howToUse: string;
  @Prop({ type: [String], default: [] }) skinType: string[];
  @Prop({ type: [String], default: [] }) tags: string[];

  @Prop({ default: 0 }) stock: number;
  @Prop({ default: false }) isFeatured: boolean;
  @Prop({ default: true }) isActive: boolean;
  @Prop({ default: null }) deletedAt: Date;

  @Prop({ default: 0 }) originalPrice: number;
  @Prop({ default: 0 }) discountPct: number;
  @Prop() tagline: string;
  @Prop({ default: 'enJoyful Life' }) brand: string;
  @Prop({ type: [String], default: [] }) highlights: string[];
  @Prop({ type: [String], default: [] }) suitableFor: string[];
  @Prop({ default: false }) isHidden: boolean;
  @Prop({ default: false }) onSale: boolean;
  @Prop({ default: false }) bestDeal: boolean;
  // Curated "Customer Favourites" flag — drives the homepage Customer Favourites row.
  @Prop({ default: false }) isBestSeller: boolean;

  // External marketplace links — admin can set URL per provider and toggle each on/off.
  // A button renders on the storefront iff url is non-empty AND visible === true.
  @Prop({ type: ExternalBuyLinksSchema, default: () => ({}) })
  externalBuyLinks: ExternalBuyLinks;

  // Groups all size variants of the same product under one slug (e.g. "almond-body-lotion").
  // Used by the UI to fetch sibling sizes and render a size selector on the product page.
  @Prop({ index: true }) productFamily: string;

  // ── Rich Catalog Fields (from product catalog spec) ──────────────────────────
  @Prop() productCode: string;
  @Prop() skuCode: string;
  @Prop() variant: string;
  @Prop() unitType: string;
  @Prop() mockupStatus: string;
  @Prop() size: string;
  @Prop() itemForm: string;
  @Prop() shortDescription: string;
  @Prop({ type: [String], default: [] }) activeIngredients: string[];
  @Prop({ type: [String], default: [] }) features: string[];
  @Prop() targetUse: string;
  @Prop({ type: [String], default: [] }) hairType: string[];
  @Prop() scent: string;
  @Prop() texture: string;
  @Prop() recommendedUsage: string;
  @Prop() precautions: string;
  @Prop() seoTitle: string;
  @Prop() metaDescription: string;
  @Prop({ type: [String], default: [] }) keywords: string[];
  @Prop({ type: [String], default: [] }) searchTags: string[];
  @Prop() barcode: string;
  @Prop() shelfLife: string;
  @Prop() storageInstructions: string;
  @Prop() countryOfOrigin: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 'text', description: 'text', tags: 'text', searchTags: 'text', keywords: 'text' });
// Category page: equality-filter category + isActive, then range-filter / sort by price
// (also backs the heavy pre-group { price: 1 } sort in findAll's aggregation).
ProductSchema.index({ category: 1, isActive: 1, price: 1 });
// slug already has a unique index via @Prop({ unique: true }) — no duplicate needed.
ProductSchema.index({ deletedAt: 1 });
// Back the storefront sort options (newest / rating) and admin recency listings.
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ rating: -1 });
// Nav-menu subcategory filtering.
ProductSchema.index({ subcategory: 1 });
