import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpTokenDocument = OtpToken & Document;

@Schema({ timestamps: true })
export class OtpToken {
  @Prop({ required: true, lowercase: true, index: true }) email: string;
  @Prop({ required: true }) codeHash: string;          // bcrypt(code)
  @Prop({ required: true }) expiresAt: Date;
  @Prop({ default: 0 }) attempts: number;              // wrong-code attempts
  @Prop({ type: Date, default: null }) usedAt: Date | null;  // when verified successfully
}

export const OtpTokenSchema = SchemaFactory.createForClass(OtpToken);
// Auto-expire tokens 24h after creation as a safety net (separate from expiresAt enforcement in code).
OtpTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });
OtpTokenSchema.index({ email: 1, createdAt: -1 });
