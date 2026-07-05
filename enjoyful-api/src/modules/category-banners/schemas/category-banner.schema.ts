import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CATEGORY_BANNER_CATEGORIES } from '../category-banner-categories';

export type CategoryBannerDocument = CategoryBanner & Document;

@Schema({ timestamps: true })
export class CategoryBanner {
  @Prop({ required: true, unique: true, enum: CATEGORY_BANNER_CATEGORIES })
  category: string;

  @Prop({ default: '' }) desktopImageUrl: string;
  @Prop({ default: '' }) mobileImageUrl: string;
}

export const CategoryBannerSchema = SchemaFactory.createForClass(CategoryBanner);
