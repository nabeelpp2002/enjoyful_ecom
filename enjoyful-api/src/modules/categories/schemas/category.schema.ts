import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true, trim: true }) name: string;
  @Prop({ required: true, unique: true, lowercase: true }) slug: string;
  @Prop() description: string;
  @Prop() tintColor: string;
  @Prop({ default: 0 }) sortOrder: number;
  @Prop({ default: true }) isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
