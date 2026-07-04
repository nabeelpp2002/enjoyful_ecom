import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventDocument = Event & Document;

export type EventType =
  | 'page_view'
  | 'product_view'
  | 'product_click'
  | 'add_to_cart'
  | 'add_to_wishlist'
  | 'search'
  | 'checkout_initiated';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Event {
  @Prop({
    required: true,
    enum: [
      'page_view',
      'product_view',
      'product_click',
      'add_to_cart',
      'add_to_wishlist',
      'search',
      'checkout_initiated',
    ],
    index: true,
  })
  type: EventType;

  @Prop({ required: true, index: true }) sessionId: string;
  @Prop({ type: Types.ObjectId, ref: 'Product', index: true }) productId: Types.ObjectId | null;
  @Prop({ default: '' }) productName: string;
  @Prop({ default: '' }) path: string;
  @Prop({ default: '' }) query: string;
  @Prop({ default: '' }) referrer: string;
  @Prop({ default: '' }) userAgent: string;
  @Prop({ default: '' }) device: string;
  @Prop({ type: Object, default: {} }) metadata: Record<string, unknown>;
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.index({ createdAt: -1 });
EventSchema.index({ type: 1, createdAt: -1 });
EventSchema.index({ productId: 1, type: 1 });
