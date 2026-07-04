import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BannerDocument = Banner & Document;

@Schema({ _id: false })
class BannerImageVariant {
  @Prop({ required: true }) url: string;
  @Prop({ required: true }) publicId: string;
}
const BannerImageVariantSchema = SchemaFactory.createForClass(BannerImageVariant);

@Schema({ _id: false })
class BannerImage {
  @Prop({ type: BannerImageVariantSchema }) desktop: BannerImageVariant;
  @Prop({ type: BannerImageVariantSchema }) mobile: BannerImageVariant;
}
const BannerImageSchema = SchemaFactory.createForClass(BannerImage);

@Schema({ timestamps: true })
export class Banner {
  @Prop({
    required: true,
    enum: ['hero', 'category-top', 'mid-page', 'popup'],
  })
  slot: string;

  @Prop({ required: true, trim: true }) title: string;
  @Prop({ trim: true }) subtitle: string;
  @Prop({ trim: true }) ctaText: string;
  @Prop({ trim: true }) ctaUrl: string;

  @Prop({ type: BannerImageSchema }) image: BannerImage;

  @Prop({ default: false }) isActive: boolean;
  @Prop({ default: 0 }) sortOrder: number;

  @Prop({ type: Date }) scheduleStart: Date;
  @Prop({ type: Date }) scheduleEnd: Date;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);

BannerSchema.index({ slot: 1, sortOrder: 1 });
BannerSchema.index({ isActive: 1 });
