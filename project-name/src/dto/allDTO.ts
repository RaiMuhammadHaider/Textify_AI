import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from 'src/types/user.types';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSignupDto {
  @ApiProperty()
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

   @ApiProperty()
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

 @ApiProperty()
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class CreateLoginDto {
   @ApiProperty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

   @ApiProperty()
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

export class VerifyOtpDto {
  @ApiProperty()
  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  @MinLength(6, { message: 'OTP must be 6 characters long' })
  otp: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class VerifyResetOtpDto {
  @ApiProperty()
  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  @MinLength(6, { message: 'OTP must be 6 characters long' })
  otp: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  @MinLength(6, { message: 'OTP must be 6 characters long' })
  otp: string;

  @ApiProperty()
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}

// For backward compatibility
export class RegisterUserDto {
   @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name: string;

 @ApiProperty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

   @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
 
   @ApiProperty()
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  otp?: string | null;

  @ApiProperty({ required: false, nullable: true, type: String })
  @IsOptional()
  otpExpiry?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  resetOtp?: string | null;

  @ApiProperty({ required: false, nullable: true, type: String })
  @IsOptional()
  resetOtpExpiry?: Date | null;
}
