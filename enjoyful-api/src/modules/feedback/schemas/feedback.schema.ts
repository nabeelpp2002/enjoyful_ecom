import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

export type FeedbackStatus = 'new' | 'read' | 'archived';

@Schema({ timestamps: true })
export class Feedback {
  // Feedback is left by signed-in customers from the storefront profile sheet.
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true }) userName: string;
  @Prop({ required: true, lowercase: true, trim: true }) userEmail: string;

  // Optional 1–5 star satisfaction rating (0 = not provided).
  @Prop({ default: 0, min: 0, max: 5 }) rating: number;

  @Prop({ required: true, trim: true, maxlength: 2000 }) message: string;

  @Prop({ default: 'new', enum: ['new', 'read', 'archived'], index: true })
  status: FeedbackStatus;

  @Prop({ type: Date, default: null }) readAt: Date | null;
  @Prop({ type: Date, default: null }) archivedAt: Date | null;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
// Admin moderation list sorts globally by recency.
FeedbackSchema.index({ createdAt: -1 });
