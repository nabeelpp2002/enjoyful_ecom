import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema({ _id: false })
class Address {
  @Prop({ required: true }) label: string;
  @Prop({ required: true }) street: string;
  @Prop() line2: string;
  @Prop({ required: true }) city: string;
  @Prop({ default: 'AE' }) country: string;
  @Prop({ default: false }) isDefault: boolean;
}
const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  // Optional — passwordless users (OTP / Google sign-in) have no password.
  @Prop({ select: false })
  password: string;

  @Prop({ default: '', trim: true }) firstName: string;
  @Prop({ default: '', trim: true }) lastName: string;

  @Prop({ enum: ['customer', 'admin'], default: 'customer' })
  role: string;

  @Prop({ default: true }) isActive: boolean;

  @Prop({ select: false }) refreshToken: string;

  // Sign-in providers this account has used.
  @Prop({ type: [String], enum: ['password', 'otp', 'google'], default: [] })
  providers: string[];

  @Prop({ default: false }) emailVerified: boolean;
  @Prop() googleSub: string;       // Google's stable user identifier
  @Prop() avatarUrl: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Admin user list sorts by recency and filters by active status / recent signups.
// (email already has a unique index via `unique: true`.)
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isActive: 1, createdAt: -1 });
