import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryBannerDocument = CategoryBanner & Document;

@Schema({ timestamps: true })
export class CategoryBanner {
  @Prop({ required: true, unique: true, enum: ['Glow', 'Baby', 'Daily', 'Home', 'Home Care', 'Fragrances'] })
  category: string;

  @Prop({ default: '' }) desktopImageUrl: string;
  @Prop({ default: '' }) mobileImageUrl: string;
}

export const CategoryBannerSchema = SchemaFactory.createForClass(CategoryBanner);
