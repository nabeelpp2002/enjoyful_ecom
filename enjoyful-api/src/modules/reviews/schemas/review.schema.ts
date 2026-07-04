import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  product: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true }) userName: string;
  @Prop({ required: true, lowercase: true }) userEmail: string;
  @Prop() avatarUrl: string;

  @Prop({ required: true, min: 1, max: 5 }) rating: number;
  @Prop({ trim: true, maxlength: 120 }) title: string;
  @Prop({ trim: true, maxlength: 2000, required: true }) comment: string;

  @Prop({ default: false }) isVerifiedPurchase: boolean;
  @Prop({ default: true }) isApproved: boolean;          // auto-approve; admin can hide
  @Prop({ default: false }) isHidden: boolean;           // admin temporarily hides from storefront
  @Prop({ type: Date, default: null }) hiddenAt: Date | null;
  @Prop({ default: false }) isDeleted: boolean;          // admin soft-deletes (kept in DB for audit)
  @Prop({ type: Date, default: null }) deletedAt: Date | null;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.index({ product: 1, createdAt: -1 });
// Admin "all reviews" moderation list sorts globally by recency (across all products).
ReviewSchema.index({ createdAt: -1 });
