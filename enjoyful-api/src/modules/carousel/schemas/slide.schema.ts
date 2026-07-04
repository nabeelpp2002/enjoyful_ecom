import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SlideDocument = Slide & Document;

@Schema({ timestamps: true })
export class Slide {
  @Prop({ required: true }) title: string;
  @Prop() subtitle: string;
  @Prop() description: string;
  @Prop({ default: 'Shop Now' }) buttonText: string;
  @Prop({ default: '/category/all' }) buttonLink: string;

  // Separate desktop + mobile imagery — both stored as Cloudinary URLs
  @Prop({ default: '' }) desktopImageUrl: string;
  @Prop({ default: '' }) mobileImageUrl: string;

  // Legacy single-image field — kept for backwards compatibility
  @Prop({ default: '' }) imageUrl: string;

  @Prop({ default: 0 }) order: number;
  @Prop({ default: true }) isActive: boolean;
}

export const SlideSchema = SchemaFactory.createForClass(Slide);
SlideSchema.index({ order: 1 });
SlideSchema.index({ isActive: 1, order: 1 });
