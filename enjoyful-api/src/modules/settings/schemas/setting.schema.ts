import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingDocument = Setting & Document;

@Schema({ timestamps: true })
export class Setting {
  @Prop({ required: true, unique: true, default: 'global_config' })
  key: string;

  @Prop({ required: true, default: true })
  showProductPrices: boolean;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
