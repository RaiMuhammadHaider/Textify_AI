import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type UserDocument = HydratedDocument<User>;
import { UserRole } from 'src/types/user.types';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, minlength: 3 })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ default: UserRole.User })
  role: UserRole;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: String, default: null })
  otp: string | null;

  @Prop({ type: Date, default: null })
  otpExpiry: Date | null;

  @Prop({ type: String, default: null })
  resetOtp: string | null;

  @Prop({ type: Date, default: null })
  resetOtpExpiry: Date | null;

  @Prop({ default: 'free' })
  subscriptionPlan?: string;

  @Prop({ default: 'active' })
  subscriptionStatus?: string;

  @Prop({ type: String, default: null })
  stripeCustomerId?: string | null;

  @Prop({ type: String, default: null })
  stripeSubscriptionId?: string | null;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
